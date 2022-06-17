import { MakeError, Type } from '@freik/core-utils';
import { AsyncSend } from '@freik/elect-main-utils/lib/comms';
import type { Attributes } from '@freik/media-core';
import { Encode, Metadata as MD } from '@freik/media-utils';
import { ForFiles, PathUtil, ProcUtil } from '@freik/node-utils';
import { pLimit } from '@freik/p-limit';
import ocp from 'node:child_process';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
    ['format', (o: unknown): o is 'm4a' | 'aac' | 'mp3' => o === 'm4a'],
    ['bitrate', Type.isNumber],
  ],
  [],
);

const cwd = process.cwd();

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
  alreadyExists,
  mediaInfoFailure,
  encodeFailure,
  unknownError,
  alreadyLowBitRate,
  success,
}

type TranscodeResult = {
  code: XcodeResCode;
  message: string;
};

const tr = (code: XcodeResCode, message: string) => ({ code, message });
let bitrate = 131072;

export async function toMp4Async(
  originalFile: string,
  newFile: string,
): Promise<TranscodeResult> {
  // const quality = 1.0;
  try {
    try {
      await fsp.stat(newFile);
      return tr(
        XcodeResCode.alreadyExists,
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
          XcodeResCode.mediaInfoFailure,
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
          info.bitrate < bitrate * 1.1
        ) {
          // If it's less than 10% higher than the target, we're fine
          // Unless it's a wma, and then we still have to convert it
          return tr(XcodeResCode.alreadyLowBitRate, originalFile);
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { 'b:a': bitrate.toString(), movflags: '+faststart' },
        metadata as unknown as Attributes,
      )
    ) {
      return tr(
        XcodeResCode.success,
        `Successfully transcode ${originalFile} to ${newFile}`,
      );
    } else {
      return tr(
        XcodeResCode.encodeFailure,
        `Unable to encode ${originalFile} to ${newFile}`,
      );
    }
  } catch (e) {
    if (Type.hasType(e, 'toString', Type.isFunction)) {
      return tr(
        XcodeResCode.unknownError,
        `${Type.asString(e, 'unknown error')} occurred.`,
      );
    } else {
      return tr(XcodeResCode.unknownError, 'unknown error occurred');
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
  settings: TranscodeInfo,
  file: string,
  filePairs?: Map<string, string>,
): Promise<void> {
  const srcdir = settings.source;
  const targetDir = settings.dest;
  reportFilePending();
  try {
    if (!path.normalize(file).startsWith(srcdir)) {
      reportFailure(file, `${file} doesn't match ${srcdir}`);
      return;
    }
    const relName = path.join(targetDir, file.substring(srcdir.length));
    const newName = PathUtil.changeExt(relName, 'm4a');
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
    const res = await toMp4Async(file, newName);
    switch (res.code) {
      case XcodeResCode.alreadyLowBitRate:
        try {
          await fsp.copyFile(file, relName);
          if (filePairs !== undefined) {
            filePairs.set(file, relName);
          }
        } catch (e) {
          reportFailure(
            file,
            `Unable to copy already mid-quality file ${file} to ${relName}`,
          );
        }
        reportFileTranscoded(file);
        break;
      case XcodeResCode.success:
        reportFileTranscoded(file);
        if (filePairs !== undefined) {
          filePairs.set(file, newName);
        }
        break;
      case XcodeResCode.alreadyExists:
        reportFileUntouched();
        if (filePairs !== undefined) {
          filePairs.set(file, newName);
        }
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

function pathfix(f: string): string {
  return f.split('\\').join('/').toLowerCase();
}

async function cleanTarget(
  settings: TranscodeInfo,
  filePairs: Map<string, string>,
): Promise<void> {
  const leftovers: Set<string> = new Set<string>();
  const transcoded: Set<string> = new Set<string>(
    [...filePairs.values()].map(pathfix),
  );
  await ForFiles(
    settings.dest,
    (fileName) => {
      const pf = pathfix(fileName);
      if (!transcoded.has(pf)) {
        leftovers.add(fileName);
      }
      return true;
    },
    {
      keepGoing: true,
      fileTypes: ['flac', 'mp3', 'wma', 'wav', 'm4a', 'aac'],
      order: 'breadth',
      skipHiddenFiles: true,
      skipHiddenFolders: true,
      dontAssumeDotsAreHidden: false,
      dontFollowSymlinks: false,
    },
  );
  // console.log(leftovers);
  // console.log(leftovers.size);
}

async function handleLots(
  settings: TranscodeInfo,
  files: string[],
): Promise<void> {
  const limit = pLimit(Math.max(os.cpus().length - 2, 1));
  const filePairs: Map<string, string> | undefined = settings.mirror
    ? new Map<string, string>()
    : undefined;
  try {
    await Promise.all(
      files.map((f) => limit(async () => convert(settings, f, filePairs))),
    );
  } catch (e) {
    err('Crashy crashy :(');
    err(e);
    reportStatusMessage(
      `And exception occured: ${Type.asString(e, 'unknown')}`,
    );
  }
  if (filePairs !== undefined) {
    // Find all the files in the mirror target, and remove any files that don't
    // have matching pairs in the source
    await cleanTarget(settings, filePairs);
  }
}

export function getXcodeStatus(): Promise<TranscodeState> {
  return Promise.resolve(curStatus);
}

export async function startTranscode(settings: TranscodeInfo): Promise<void> {
  clearStatus();
  bitrate = settings.bitrate;
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
        recurse: async (dirName: string): Promise<boolean> => {
          const toSkip = PathUtil.join(dirName, '.notranscode');
          try {
            await fsp.access(toSkip);
          } catch (e) {
            return Type.has(e, 'code') && e.code === 'ENOENT';
          }
          return false;
        },
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
    await handleLots(settings, workQueue);
  } finally {
    reportStatusMessage('Transcoding Completed.');
    finishStatusReporting();
  }
}
