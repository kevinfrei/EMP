import { MakeError, Type } from '@freik/core-utils';
import { AsyncSend } from '@freik/elect-main-utils/lib/comms';
import type { Attributes } from '@freik/media-core';
import { Encode, Metadata as MD } from '@freik/media-utils';
import { ForFiles, PathUtil, ProcUtil } from '@freik/node-utils';
import ocp from 'node:child_process';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pLimit from 'p-limit';
import { IpcId, TranscodeInfo, TranscodeState } from 'shared';

const err = MakeError('downsample-err');

const cp = {
  spawnAsync: ProcUtil.spawnAsync,
  ...ocp,
};

export const isXcodeInfo = Type.isSpecificTypeFn<TranscodeInfo>(
  [
    ['source', Type.isString],
    ['dest', Type.isString],
    ['artwork', Type.isBoolean],
    ['mirror', Type.isBoolean],
    [
      'format',
      (o: unknown): o is 'm4a' | 'aac' | 'mp3' =>
        o === 'm4a' || o === 'aac' || o === 'mp3',
    ],
  ],
  [],
);

let cwd: string = process.cwd();

export function setCwd(pathStr: string): void {
  cwd = pathStr;
}

const deQuote = (str: string): string => str.replace(/\"/g, '~!~');

function reQuote(str: string): { [key: string]: string } {
  let res: string = str.replace(/\\/g, '\\\\');
  res = res.replace(/\"/g, '\\"');
  res = res.replace(/~!~/g, '"');
  return JSON.parse(res) as { [key: string]: string };
}

/// vvvv Hurray for a Typescript compiler bug
// eslint-disable-next-line no-shadow
enum XcodeResCode {
  AlreadyExists,
  MediaInfoFailure,
  EncodeFailure,
  UnknownError,
  AlreadyLowBitRate,
  Success,
}

type TranscodeResult = {
  code: XcodeResCode;
  message: string;
};

const tr = (code: XcodeResCode, message: string) => ({ code, message });

export async function toMp4Async(
  originalFile: string,
  newFile: string,
  theCut: number,
): Promise<TranscodeResult> {
  const quality = 1.0;
  try {
    try {
      await fsp.stat(newFile);
      return tr(
        XcodeResCode.AlreadyExists,
        `'${newFile}' already appears to exist`,
      );
    } catch (error) {
      /* The file doesn't exist, so we're happy */
    }
    const ext: string = PathUtil.getExtNoDot(originalFile).toLowerCase();
    if (ext !== 'flac' && ext !== 'wma') {
      // First run mediaInfo to get the bit rate
      const arg: string = deQuote('--Output=Audio;{"bitrate":"%BitRate%"}');
      const res = await cp.spawnAsync('mediainfo', [arg, originalFile], {
        cwd,
        encoding: 'utf8',
      });
      if (
        Type.has(res, 'error') &&
        Type.has(res.error, 'toString') &&
        Type.isFunction(res.error.toString)
      ) {
        // MediaInfo failed: no continue, sorry
        const resStr = Type.asString(res.error.toString(), 'Unknown error');
        return tr(
          XcodeResCode.MediaInfoFailure,
          `mediainfo returned an error '${resStr}':${res.stderr.toString()}`,
        );
      }
      const info: { [key: string]: string | number } = reQuote(
        res.stdout.toString(),
      );
      if (ext !== 'wma' && ext !== 'flac' && ext !== 'wav') {
        if (
          Type.isObject(info) &&
          Type.has(info, 'bitrate') &&
          Type.isNumber(info.bitrate) &&
          info.bitrate < theCut
        ) {
          // If it's less that 140kbps, we're fine
          // Unless it's a wma, and then we still have to convert it
          return tr(XcodeResCode.AlreadyLowBitRate, originalFile);
        }
      }
    }
    let metadata = await MD.FromFileAsync(originalFile);
    if (!metadata) {
      metadata = MD.FromPath(originalFile);
    } else {
      // If we got metadata from the file, ffmpeg will just 'handle' it :)
      metadata = undefined;
    }
    if (
      await Encode.FfmpegAsync(
        originalFile,
        newFile,
        { q: quality.toString() },
        metadata as unknown as Attributes,
      )
    ) {
      return tr(
        XcodeResCode.Success,
        `Successfully transcode ${originalFile} to ${newFile}`,
      );
    } else {
      return tr(
        XcodeResCode.EncodeFailure,
        `Unable to encode ${originalFile} to ${newFile}`,
      );
    }
  } catch (e) {
    if (Type.hasType(e, 'toString', Type.isFunction)) {
      return tr(
        XcodeResCode.UnknownError,
        `${Type.asString(e, 'unknown error')} occurred.`,
      );
    } else {
      return tr(XcodeResCode.UnknownError, 'unknown error occurred');
    }
  }
}

const transcodeStatusStart: Readonly<TranscodeState> = Object.freeze({
  curStatus: '',
  filesTranscoded: [],
  filesPending: 0,
  filesUntouched: 0,
  filesFound: 0,
  // itemsRemoved?: string[];
  // filesFailed?: { file: string; error: string }[];
});

let curStatus: TranscodeState = { ...transcodeStatusStart };

function clearStatus() {
  curStatus = { ...transcodeStatusStart };
}

function reportStatus() {
  const message: { [key: string]: TranscodeState } = {};
  message[IpcId.TranscodingUpdate.toString()] = curStatus;
  AsyncSend(message);
}

let reportEvent: null | ReturnType<typeof setTimeout> = null;

function startStatusReporting() {
  if (reportEvent !== null) {
    clearInterval(reportEvent);
  }
  reportEvent = setInterval(reportStatus, 500);
}

function stopStatusReporting() {
  if (reportEvent !== null) {
    clearInterval(reportEvent);
  }
  reportEvent = null;
}

function finishStatusReporting() {
  stopStatusReporting();
  reportStatus();
}

// This is the "overall status" message
function reportStatusMessage(msg: string) {
  curStatus.curStatus = msg;
}

// The number of directories we've looked through
function reportFileFound() {
  curStatus.filesFound++;
}

// The files that were actually transcoded
function reportFileTranscoded(file: string) {
  curStatus.filesTranscoded.push(file);
}

// A file is currently being transcoded
function reportFilePending() {
  curStatus.filesPending++;
}

// A file is no longer being transcoded
function removeFilePending() {
  curStatus.filesPending--;
}

// A file was left alone (already present in the destination)
function reportFileUntouched() {
  curStatus.filesUntouched++;
}

// We removed an item from the transcoding destination because it's not in the source
function reportItemRemoved(item: string) {
  if (!curStatus.itemsRemoved) {
    curStatus.itemsRemoved = [item];
  } else {
    curStatus.itemsRemoved.push(item);
  }
}

// A transcode failed
function reportFailure(file: string, error: string) {
  if (!curStatus.filesFailed) {
    curStatus.filesFailed = [{ file, error }];
  } else {
    curStatus.filesFailed.push({ file, error });
  }
}

async function convert(
  srcdir: string,
  targetDir: string,
  file: string,
): Promise<void> {
  reportFilePending();
  try {
    if (!path.normalize(file).startsWith(srcdir)) {
      reportFailure(file, `${file} doesn't match ${srcdir}`);
      return;
    }
    const relName = path.join(targetDir, file.substring(srcdir.length));
    const newName = PathUtil.changeExt(relName, 'm4a');
    if (!newName) {
      reportFailure(file, `Name failure: ${file} => ${newName}`);
      return;
    }
    try {
      const dr = path.dirname(newName);
      try {
        await fsp.stat(dr);
      } catch (e) {
        await fsp.mkdir(dr, { recursive: true });
      }
    } catch (e) {
      reportFailure(
        newName,
        `Unable to find/create the directory for ${newName}`,
      );
      return;
    }
    const res = await toMp4Async(file, newName, 140000);
    switch (res.code) {
      case XcodeResCode.AlreadyLowBitRate:
        try {
          await fsp.copyFile(file, relName);
        } catch (e) {
          reportFailure(
            file,
            `Unable to copy already mid-quality file ${file} to ${relName}`,
          );
        }
        break;
      case XcodeResCode.Success:
        reportFileTranscoded(file);
        break;
      case XcodeResCode.AlreadyExists:
        reportFileUntouched();
        break;
      default:
        reportFailure(
          file,
          `Transcode failure ${res.code}: ${res.message} - ${file} => ${newName}`,
        );
    }
  } finally {
    removeFilePending();
  }
}

async function handleLots(
  srcdir: string,
  targetDir: string,
  files: string[],
): Promise<void> {
  const limit = pLimit(Math.max(os.cpus().length - 2, 1));
  try {
    await Promise.all(
      files.map((f) => limit(async () => convert(srcdir, targetDir, f))),
    );
  } catch (e) {
    err('Crashy crashy :(');
    err(e);
    reportStatusMessage(
      `And exception occured: ${Type.asString(e, 'unknown')}`,
    );
  }
}

export function getXcodeStatus(): Promise<TranscodeState> {
  return Promise.resolve(curStatus);
}

export async function startTranscode(settings: TranscodeInfo): Promise<void> {
  clearStatus();
  startStatusReporting();
  try {
    reportStatusMessage(`Scanning source: ${settings.source}`);
    const workQueue: string[] = [];
    await ForFiles(
      settings.source,
      (fileName) => {
        workQueue.push(fileName);
        reportFileFound();
        return true;
      },
      {
        recurse: true,
        keepGoing: true,
        fileTypes: ['flac', 'mp3', 'wma', 'wav', 'm4a', 'aac'],
        order: 'breadth',
        skipHiddenFiles: true,
        skipHiddenFolders: true,
        dontAssumeDotsAreHidden: false,
        dontFollowSymlinks: false,
      },
    );
    // We've now got our work queue
    reportStatusMessage('Completed scanning. Transcoding in progress.');
    await handleLots(settings.source, settings.dest, workQueue);
  } finally {
    finishStatusReporting();
  }
}
