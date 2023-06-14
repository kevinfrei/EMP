import { Comms, Persistence } from '@freik/elect-main-utils';
import { MakeLog } from '@freik/logger';
import { SongKey } from '@freik/media-core';
import {
  asString,
  hasField,
  hasFieldType,
  hasStrField,
  isFunction,
} from '@freik/typechk';
import { ProtocolRequest, ProtocolResponse, protocol } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { GetAudioDB, UpdateAudioLocations } from './AudioDatabase';
import { PictureHandler } from './cover-art';

const { log } = MakeLog('EMP:main:protocols');

export type FileResponse = string | ProtocolResponse;
export type BufferResponse = Buffer | ProtocolResponse;

const audioMimeTypes = new Map<string, string>([
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/m4a'],
  ['.aac', 'audio/aac'],
  ['.flac', 'audio/x-flac'],
  ['.wma', 'audio/x-ms-wma'],
]);

let defPath: string | null = null;
function defaultAlbumPicPath() {
  if (defPath === null) {
    defPath = path.join(process.env.PUB, 'img-album.svg');
  }
  return defPath;
}

let defaultAlbumPicBuffer: BufferResponse | null = null;
let defaultAlbumPicUri: string | null = null;

export async function GetDefaultAlbumPicBuffer(): Promise<BufferResponse> {
  if (!defaultAlbumPicBuffer) {
    defaultAlbumPicBuffer = {
      data: await fs.readFile(defaultAlbumPicPath()),
      mimeType: 'image/svg+xml',
    };
  }
  return defaultAlbumPicBuffer;
}

export async function GetDefaultAlbumPicUri(): Promise<string> {
  if (!defaultAlbumPicUri) {
    const br = await GetDefaultAlbumPicBuffer();
    if (
      hasStrField(br, 'mimeType') &&
      hasField(br, 'data') &&
      hasFieldType(br.data, 'toString', isFunction)
    ) {
      let svg = br.data.toString() as string;
      // Remove space from between tags, duplicate spaces
      svg = svg.replace(/>\s{1,}</g, '><');
      svg = svg.replace(/\s{1,}\/>/g, '/>');
      svg = svg.replace(/\s{2,}/g, ' ');
      svg = svg.trim();
      // Encode the uri-unsafe characters
      svg = svg.replace(/[%#<>?\[\\\]^`{|}]/g, encodeURIComponent);
      defaultAlbumPicUri = `data:image/svg+xml,${svg}`;
    }
  }
  return asString(defaultAlbumPicUri, '');
}

let defArtist: string | null = null;
function defaultArtistPicPath() {
  if (!defArtist) {
    defArtist = path.join(process.env.PUB, 'img-artist.svg');
  }
  return defArtist;
}

let defaultArtistPicBuffer: BufferResponse | null = null;

export async function GetDefaultArtistPicBuffer(): Promise<BufferResponse> {
  if (!defaultArtistPicBuffer) {
    defaultArtistPicBuffer = {
      data: await fs.readFile(defaultArtistPicPath()),
      mimeType: 'image/svg+xml',
    };
  }
  return defaultArtistPicBuffer;
}

const e404 = { error: 404 };

async function tuneProtocolHandler(
  req: ProtocolRequest,
  trimmedUrl: string,
): Promise<FileResponse> {
  const key: SongKey = trimmedUrl;
  log(`SongKey: ${key}`);
  const db = await GetAudioDB();
  log('Got DB');
  const song = db.getSong(key);
  if (song) {
    const thePath = song.path;
    log('Returning file read from ' + thePath);
    const mimeType =
      audioMimeTypes.get(path.extname(thePath).toLowerCase()) ?? 'audio/mpeg';
    return { path: thePath, mimeType };
  } else {
    log('Song not found');
    return e404;
  }
}

// This sets up all protocol handlers
export async function RegisterProtocols(): Promise<void> {
  const defPicBuffer = await GetDefaultAlbumPicBuffer();
  // TODO: Enable both song & album pictures
  // folder-level photos are fine, but for song requests, check the song
  // then fall back to the album
  log('Registering pic://key/ protocol');
  Comms.registerProtocolHandler(
    'pic://key/',
    // eslint-disable-next-line @typescript-eslint/unbound-method
    protocol.registerBufferProtocol,
    PictureHandler,
    defPicBuffer,
  );
  log('Registering tune://song/ protocol');
  Comms.registerProtocolHandler(
    'tune://song/',
    // eslint-disable-next-line @typescript-eslint/unbound-method
    protocol.registerFileProtocol,
    tuneProtocolHandler,
  );
  log('Finished protocol registration');
}

// This sets up reactive responses to changes, for example:
// locations change, so music needs to be rescanned
export function RegisterListeners(): void {
  Persistence.subscribe('locations', UpdateAudioLocations);
}
