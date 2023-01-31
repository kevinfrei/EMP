import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { AsyncSend } from '@freik/elect-main-utils/lib/comms';
import type { Attributes } from '@freik/media-core';
import { Encode, Metadata as MD } from '@freik/media-utils';
import { ForDirs, ForFiles, PathUtil, ProcUtil } from '@freik/node-utils';
import { pLimit } from '@freik/p-limit';
import ocp from 'node:child_process';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import rimraf from 'rimraf';
import {
  IpcId,
  TranscodeInfo,
  TranscodeSourceType,
  TranscodeState,
} from 'shared';
import { GetAudioDB } from './AudioDatabase';
import { LoadPlaylist } from './playlists';

const err = MakeError('transcoding-err');
const log = MakeLogger('transcoding');

const cp = {
  spawnAsync: ProcUtil.spawnAsync,
  ...ocp,
};

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
let bitrate = 163840;

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

// Set up an event every 2 seconds to update the UI with the state of transcoding
function startStatusReporting() {
  if (reportEvent !== null) {
    clearInterval(reportEvent);
  }
  reportEvent = setInterval(reportStatus, 2000);
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
function reportFilesFound(count?: number) {
  curStatus.filesFound += count ? count : 1;
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

// Get the full song file name from the song's media info in the database
async function getFullSongPathFromSettings(
  settings: TranscodeInfo,
  file: string,
): Promise<[string, string] | void> {
  if (settings.source.type === TranscodeSourceType.Disk) {
    const srcdir = settings.source.loc;
    if (!path.normalize(file).startsWith(srcdir)) {
      reportFailure(file, `${file} doesn't match ${srcdir}`);
      return;
    }
    return [file, path.join(settings.dest, file.substring(srcdir.length))];
  } else {
    const db = await GetAudioDB();
    const filepath = db.getCanonicalFileName(file);
    const src = db.getSong(file);
    if (src && filepath) {
      return [src.path, filepath.replaceAll('/', path.sep)];
    }
  }
}

function isImage(filepath: string): boolean {
  const fp = filepath.toLocaleUpperCase();
  return fp.endsWith('.PNG') || fp.endsWith('.JPG');
}

async function convert(
  settings: TranscodeInfo,
  file: string,
  filePairs?: Map<string, string>,
): Promise<void> {
  reportFilePending();
  // First, check to see if it's a cover image
  if (isImage(file)) {
    if (settings.artwork) {
      // TOOD: Copy artwork, because we're supposed to:
    }
    return;
  }
  try {
    const fullSongPath = await getFullSongPathFromSettings(settings, file);
    if (!fullSongPath) {
      return;
    }
    const src = fullSongPath[0];
    let relName = fullSongPath[1];
    if (!path.isAbsolute(relName)) {
      relName = path.join(settings.dest, relName);
    }
    log(`${src} -> ${relName}`);
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
    const res = await toMp4Async(src, newName);
    switch (res.code) {
      case XcodeResCode.alreadyLowBitRate:
        try {
          await fsp.copyFile(src, relName);
          if (filePairs !== undefined) {
            filePairs.set(src, relName);
          }
        } catch (e) {
          reportFailure(
            src,
            `Unable to copy already mid-quality file ${src} to ${relName}`,
          );
        }
        reportFileTranscoded(src);
        break;
      case XcodeResCode.success:
        reportFileTranscoded(src);
        if (filePairs !== undefined) {
          filePairs.set(src, newName);
        }
        break;
      case XcodeResCode.alreadyExists:
        reportFileUntouched();
        if (filePairs !== undefined) {
          filePairs.set(src, newName);
        }
        break;
      default:
        reportFailure(
          src,
          `Transcode failure ${res.code}: ${res.message} - ${src} => ${newName}`,
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
): Promise<Set<string>> {
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
      skipHiddenFiles: false,
      skipHiddenFolders: true,
      dontAssumeDotsAreHidden: false,
      dontFollowSymlinks: false,
    },
  );
  return leftovers;
}

async function findExcessDirs(settings: TranscodeInfo): Promise<string[]> {
  // For each directory in the destination, check to see if it also exists
  // in the source location
  const result: string[] = [];
  const dst = pathfix(settings.dest);
  const src = pathfix(settings.source.loc);
  await ForDirs(
    dst,
    async (dirname: string) => {
      const theDir = pathfix(dirname);
      if (!theDir.toLocaleUpperCase().startsWith(dst.toLocaleUpperCase())) {
        err('Failed a very basic test: Not sure what to do with it...');
        return false;
      }
      const srcDir = PathUtil.join(src, theDir.substring(dst.length));
      try {
        const st = await fsp.stat(srcDir);
        if (!st.isDirectory()) {
          result.push(dirname);
        }
      } catch (e) {
        result.push(dirname);
      }
      return true;
    },
    {
      recurse: true,
    },
  );
  return result;
}

// Transcode the files from 'files' according to the settings
async function handleLots(
  settings: TranscodeInfo,
  files: string[],
): Promise<void> {
  // Don't use all the cores if we have multiple cores:
  const limit = pLimit(Math.max(os.cpus().length - 2, 1));
  // This is the (optional) list of files that we should be transcoding to
  const filePairs: Map<string, string> | undefined = settings.mirror
    ? new Map<string, string>()
    : undefined;
  try {
    // Okay, convert all the files:
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
    const toRemove = await cleanTarget(settings, filePairs);
    await Promise.all(
      [...toRemove].map((f) =>
        limit(async () => {
          reportItemRemoved(f);
          return fsp.unlink(f);
        }),
      ),
    );
    const dirsToRemove = await findExcessDirs(settings);
    for (const dir of dirsToRemove) {
      reportItemRemoved(dir);
      await rimraf(dir);
    }
  }
}

export function getXcodeStatus(): Promise<TranscodeState> {
  return Promise.resolve(curStatus);
}

// Read through all the files on the disk to build up the work queue
async function ScanSourceFromDisk(
  settings: TranscodeInfo,
  workQueue: string[],
) {
  const fileTypes = ['flac', 'mp3', 'wma', 'wav', 'm4a', 'aac'];
  if (settings.artwork) {
    fileTypes.push('jpg', 'png');
  }
  reportStatusMessage(`Scanning source: ${settings.source.loc}`);
  await ForFiles(
    settings.source.loc,
    (fileName) => {
      workQueue.push(fileName);
      reportFilesFound();
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
      order: 'breadth',
      fileTypes,
      skipHiddenFiles: !settings.artwork, // We want to pick up hidden images
      skipHiddenFolders: true,
      dontAssumeDotsAreHidden: false,
      dontFollowSymlinks: false,
    },
  );
}

// This is the entry point for the transcoding engine
export async function startTranscode(settings: TranscodeInfo): Promise<void> {
  log('Transcoding started:');
  log(settings);
  clearStatus();
  bitrate = settings.bitrate;
  // Start UI reporting
  startStatusReporting();
  try {
    const workQueue: string[] = [];
    if (settings.source.type === TranscodeSourceType.Disk) {
      await ScanSourceFromDisk(settings, workQueue);
    } else {
      // TODO: Handle artwork for this stuff
      const db = await GetAudioDB();
      switch (settings.source.type) {
        case TranscodeSourceType.Album:
          const album = db.getAlbum(settings.source.loc);
          if (album) {
            workQueue.push(...album.songs);
          }
          // TODO: Report no such album
          break;
        case TranscodeSourceType.Artist:
          const artist = db.getArtist(settings.source.loc);
          if (artist) {
            workQueue.push(...artist.songs);
          }
          // TODO: Report no such album
          break;
        case TranscodeSourceType.Playlist:
          workQueue.push(...(await LoadPlaylist(settings.source.loc)));
          break;
      }
      reportFilesFound(workQueue.length);
    }
    // We've now got our work queue
    reportStatusMessage('Completed scanning. Transcoding in progress.');
    await handleLots(settings, workQueue);
  } finally {
    reportStatusMessage('Transcoding Completed.');
    finishStatusReporting();
  }
}
