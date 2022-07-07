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

const defaultPicPath = path.join(__dirname, '..', 'img-album.svg');
let defaultPicBuffer: BufferResponse | null = null;
let defaultPicUri: string | null = null;

export async function GetDefaultPicBuffer(): Promise<BufferResponse> {
  if (!defaultPicBuffer) {
    defaultPicBuffer = {
      data: await fs.readFile(defaultPicPath),
      mimeType: 'image/svg+xml',
    };
  }
  return defaultPicBuffer;
}

export async function GetDefaultPicUri(): Promise<string> {
  if (!defaultPicUri) {
    const br = await GetDefaultPicBuffer();
    if (
      Type.hasStr(br, 'mimeType') &&
      Type.has(br, 'data') &&
      Type.hasType(br.data, 'toString', Type.isFunction)
    ) {
      const d = br.data;
      const s: unknown = d.toString();
      if (Type.isString(s)) {
        const uri = 'data:' + br.mimeType + ',' + encodeURI(s);
        defaultPicUri = uri;
      }
    }
  }
  return Type.asString(defaultPicUri, '');
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
  const defPicBuffer = await GetDefaultPicBuffer();
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
