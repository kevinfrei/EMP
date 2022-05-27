import { MakeError, Type } from '@freik/core-utils';
import type { Attributes } from '@freik/media-core';
import { Encode, Metadata as MD } from '@freik/media-utils';
import { PathUtil, ProcUtil } from '@freik/node-utils';
import glob from 'glob';
import ocp from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pLimit from 'p-limit';
import { TranscodeInfo, TranscodeState } from 'shared';

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

export async function toMp4Async(
  originalFile: string,
  newFile: string,
  theCut: number,
): Promise<string | boolean> {
  const quality = 1.0;
  try {
    try {
      await fs.promises.stat(newFile);
      return `'${newFile}' already appears to exist`;
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
        return `mediainfo returned an error '${resStr}':${res.stderr.toString()}`;
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
          return false;
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
      return true;
    } else {
      return 'Unable to encode the m4a file.';
    }
  } catch (e) {
    if (Type.hasType(e, 'toString', Type.isFunction)) {
      return `${Type.asString(e.toString(), 'unknown error')} occurred.`;
    } else {
      return 'unknown error occurred';
    }
  }
}

async function convert(
  srcdir: string,
  targetDir: string,
  file: string,
): Promise<void> {
  if (!path.normalize(file).startsWith(srcdir)) {
    err(`${file} doesn't match ${srcdir}`);
  }
  const relName = path.join(targetDir, file.substr(srcdir.length));
  const newName = PathUtil.changeExt(relName, 'm4a');
  if (!newName) {
    err(`Name failure: ${file} => ${newName}`);
  }
  try {
    const dr = path.dirname(newName);
    try {
      await fs.promises.stat(dr);
    } catch (e) {
      await fs.promises.mkdir(dr, { recursive: true });
    }
  } catch (e) {
    err(`Unable to find/create the directory for ${newName}`);
  }
  const res = await toMp4Async(file, newName, 140000);
  if (Type.isString(res)) {
    err(`Transcode failure: ${file} => ${newName}: ${res}`);
  } else if (res === false) {
    try {
      await fs.promises.copyFile(file, relName);
    } catch (e) {
      err(`Unable to copy already mid-quality file ${file} to ${relName}`);
    }
  }
}

function handleLots(srcdir: string, targetDir: string, files: string[]): void {
  const limit = pLimit(os.cpus().length);
  Promise.all(
    files.map((f) => limit(async () => convert(srcdir, targetDir, f))),
  ).catch((reason) => {
    err('Crashy crashy :(');
    err(reason);
  });
}

function getDir(maybeDir: string): string | null {
  try {
    const dirStat = fs.statSync(maybeDir);
    if (dirStat.isDirectory()) {
      return maybeDir;
    }
  } catch (e) {
    err(e);
    err('(Not a directory) ');
    err(maybeDir);
  }
  return null;
}

function Usage(errMsg?: string): void {
  if (Type.isString(errMsg)) {
    err(errMsg);
  }
  err(`${process.argv[1]} sourceDir targetDir files...`);
}

// This is only true if this is the main module
// (not being included by anyone else)
export function main(): void {
  if (process.argv.length < 5) {
    return Usage();
  }
  const srcDir = getDir(process.argv[2]);
  const targetDir = getDir(process.argv[3]);
  if (srcDir === null) {
    return Usage(`Sorry: ${srcDir || '?'} is not a directory`);
  }
  if (targetDir === null) {
    return Usage(`Sorry: ${targetDir || '?'} is not a directory`);
  }
  const matches = process.argv
    .slice(4)
    .map((v) =>
      glob.hasMagic(v, { noext: true, nobrace: true })
        ? glob.sync(v, { noext: true, nobrace: true, nonull: true })
        : v,
    )
    .flat();
  handleLots(srcDir, targetDir, matches);
}

export function getXcodeStatus(): Promise<TranscodeState> {
  return Promise.resolve({
    curStatus: '',
    dirsScanned: [],
    dirsPending: [],
    filesTranscoded: [],
    filesPending: 0,
    filesUntouched: 0,
    // itemsRemoved?: string[];
    // filesFailed?: { file: string; error: string }[];
  });
}

export function startTranscode(settings: TranscodeInfo): Promise<void> {
  switch (settings.format) {
    case 'm4a':
    case 'aac':
    case 'mp3':
      return Promise.resolve();
  }
}
