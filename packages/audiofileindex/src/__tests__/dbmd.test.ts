/*
export declare type MetadataStore = {
    get: (path: string) => MinimumMetadata | void;
    set: (path: string, md: MinimumMetadata) => void;
    fail: (path: string) => void;
    shouldTry: (path: string) => boolean;
    save: () => void;
    load: () => Promise<boolean>;
};
*/

import { FullMetadata } from '@freik/media-core';
import { MakePersistence } from '@freik/node-utils';
import { hasField, hasStrField, isMap } from '@freik/typechk';
import { promises as fsp } from 'fs';
import path from 'path';
import {
  GetMediaInfo,
  GetMetadataStore,
  IsFullMetadata,
  IsOnlyMetadata,
} from '../DbMetadata';
import { remove, removeDir } from './tst-helpers';

beforeAll(async () => {
  await remove('src/__tests__/persist-basic/basic.json');
  await removeDir('src/__tests__/persist-basic');
});

it('Full/Partial Metadata tests', () => {
  const partial = { originalPath: '/a/file/path.mp3', track: 1 };
  const fullmd: FullMetadata = {
    originalPath: 'thePath.flac',
    artist: ['artist1', 'artist2'],
    album: 'album',
    // year?: number;
    track: 3,
    title: 'title',
    // vaType?: 'va' | 'ost';
    // moreArtists?: string[];
    // variations?: string[];
    // disk?: number;
  };
  expect(IsOnlyMetadata(partial)).toBe(true);
  expect(IsFullMetadata(partial)).toBe(false);
  expect(IsOnlyMetadata(fullmd)).toBe(true);
  expect(IsFullMetadata(fullmd)).toBe(true);
  const aFewMore = { vaType: 'va', ...fullmd };
  expect(IsOnlyMetadata(aFewMore)).toBe(true);
  expect(IsFullMetadata(aFewMore)).toBe(true);
  const extras = { notOK: false, ...aFewMore };
  expect(IsOnlyMetadata(extras)).toBe(false);
  expect(IsFullMetadata(extras)).toBe(false);
});

it('Generic getMediaInfo tests', async () => {
  const data = await fsp.readFile('src/__tests__/dbmdData.json');
  const dataParse = JSON.parse(data.toString());

  const flacMap = new Map<string, string>(dataParse['flac']);
  const flacFile =
    'src/__tests__/metadata/Album - 2005 - Artist/01 - quiet.flac';
  const miFlac = await GetMediaInfo(flacFile);
  expect(isMap(miFlac)).toBeTruthy();
  expect(miFlac).toEqual(flacMap);

  const m4aMap = new Map<string, string>(dataParse['m4a']);
  const m4aFile =
    'src/__tests__/metadata/Album - 2005 - Artist/02 - quiet2.m4a';
  const mim4a = await GetMediaInfo(m4aFile);
  expect(isMap(mim4a)).toBeTruthy();
  expect(mim4a).toEqual(m4aMap);

  const mp3Map = new Map<string, string>(dataParse['mp3']);
  const mp3File =
    'src/__tests__/metadata/Album - 2005 - Artist/03 - Quiet3.mp3';
  const mimp3 = await GetMediaInfo(mp3File);
  expect(isMap(mimp3)).toBeTruthy();
  expect(mimp3).toEqual(mp3Map);

  const wmaMap = new Map<string, string>(dataParse['wma']);
  const wmaFile =
    'src/__tests__/metadata/Album - 2005 - Artist/04 - Quiet 4.wma';
  const miwma = await GetMediaInfo(wmaFile);
  expect(isMap(miwma)).toBeTruthy();
  expect(miwma).toEqual(wmaMap);

  const wavMap = new Map<string, string>(dataParse['wav']);
  const wavFile =
    'src/__tests__/metadata/Album - 2005 - Artist/05 - Quiet5.wav';
  const miwav = await GetMediaInfo(wavFile);
  expect(isMap(miwav)).toBeTruthy();
  expect(miwav).toEqual(wavMap);
});

const root = path.resolve('src/__tests__/persist-basic');
const persist = MakePersistence(root);
it('Basic Metadata Store routines', async () => {
  const mds = await GetMetadataStore(persist, 'basic', root);
  const someFile = mds.get('./data/someFile.mp3');
  expect(someFile).toBeUndefined();
  mds.set('./data/someFile.mp3', {
    originalPath: './data/someFile.mp3',
    title: 'New Title',
  });
  const tryAgain = mds.get('./data/someFile.mp3');
  expect(tryAgain).toBeDefined();
  if (!hasStrField(tryAgain, 'title')) throw new Error('No title');
  expect(tryAgain['title']).toEqual('New Title');
  mds.set('./data/someFile.mp3', {
    originalPath: './data/someFile.mp3',
    track: 1,
  });
  const more = mds.get('./data/someFile.mp3');
  expect(more).toBeDefined();
  if (!hasStrField(more, 'title')) throw new Error('No title');
  if (!hasField(more, 'track')) throw new Error('No title');
  expect(more['title']).toEqual('New Title');
  expect(more['track']).toEqual(1);
  await mds.flush();
});

it('Yet another Metadata Store', async () => {
  const mds = await GetMetadataStore(persist, 'basic', root);
  const someFile = mds.get('./data/someFile.mp3');
  expect(someFile).toBeDefined();
  if (!hasStrField(someFile, 'title')) throw new Error('No title');
  if (!hasField(someFile, 'track')) throw new Error('No title');
  expect(someFile['title']).toEqual('New Title');
  expect(someFile['track']).toEqual(1);
  mds.overwrite('./data/someFile.mp3', {
    originalPath: './data/someFile.mp3',
    track: 2,
  });
  const again = mds.get('./data/someFile.mp3');
  expect(again).toEqual({ originalPath: './data/someFile.mp3', track: 2 });
  await mds.flush();
});
