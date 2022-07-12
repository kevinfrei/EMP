import { MakeLogger, Type } from '@freik/core-utils';
import { Comms, Persistence } from '@freik/elect-main-utils';
import { SongKey } from '@freik/media-core';
import { protocol, ProtocolRequest, ProtocolResponse } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { GetAudioDB, UpdateAudioLocations } from './AudioDatabase';
import { PictureHandler } from './cover-art';

export type FileResponse = string | ProtocolResponse;
export type BufferResponse = Buffer | ProtocolResponse;

const log = MakeLogger('protocols');

const audioMimeTypes = new Map<string, string>([
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/m4a'],
  ['.aac', 'audio/aac'],
  ['.flac', 'audio/x-flac'],
  ['.wma', 'audio/x-ms-wma'],
]);

const defaultAlbumPicPath = path.join(__dirname, '..', 'img-album.svg');
let defaultAlbumPicBuffer: BufferResponse | null = null;
let defaultAlbumPicUri: string | null = null;

export async function GetDefaultAlbumPicBuffer(): Promise<BufferResponse> {
  if (!defaultAlbumPicBuffer) {
    defaultAlbumPicBuffer = {
      data: await fs.readFile(defaultAlbumPicPath),
      mimeType: 'image/svg+xml',
    };
  }
  return defaultAlbumPicBuffer;
}

export async function GetDefaultAlbumPicUri(): Promise<string> {
  if (!defaultAlbumPicUri) {
    const br = await GetDefaultAlbumPicBuffer();
    if (
      Type.hasStr(br, 'mimeType') &&
      Type.has(br, 'data') &&
      Type.hasType(br.data, 'toString', Type.isFunction)
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
  return Type.asString(defaultAlbumPicUri, '');
}

const defaultArtistPicPath = path.join(__dirname, '..', 'img-artist.svg');
let defaultArtistPicBuffer: BufferResponse | null = null;

export async function GetDefaultArtistPicBuffer(): Promise<BufferResponse> {
  if (!defaultArtistPicBuffer) {
    defaultArtistPicBuffer = {
      data: await fs.readFile(defaultArtistPicPath),
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
  Comms.registerProtocolHandler(
    'pic://key/',
    // eslint-disable-next-line @typescript-eslint/unbound-method
    protocol.registerBufferProtocol,
    PictureHandler,
    defPicBuffer,
  );
  Comms.registerProtocolHandler(
    'tune://song/',
    // eslint-disable-next-line @typescript-eslint/unbound-method
    protocol.registerFileProtocol,
    tuneProtocolHandler,
  );
}

// This sets up reactive responses to changes, for example:
// locations change, so music needs to be rescanned
export function RegisterListeners(): void {
  Persistence.subscribe('locations', UpdateAudioLocations);
}
