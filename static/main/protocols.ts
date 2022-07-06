import { MakeLogger } from '@freik/core-utils';
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
const defaultPicUri: string = [
  'data:image/svg+xml,%3Csvg',
  "xmlns='http://www.w3.org/2000/svg'",
  "xmlns:xlink='http://www.w3.org/1999/xlink'",
  "x='0' y='0' viewBox='0 0 465 465'",
  "xml:space='preserve'%3E",
  "%3Cpath d='M396.94,68.06C353.052,24.171,294.652,0,232.5,0S111.948,24.171,68.06,68.06C24.171,111.949,0,170.348,0,232.5 s24.171,120.551,68.06,164.44C111.948,440.829,170.348,465,232.5,465s120.552-24.171,164.44-68.06 C440.829,353.051,465,294.652,465,232.5S440.829,111.949,396.94,68.06z M232.5,450C112.57,450,15,352.43,15,232.5 S112.57,15,232.5,15S450,112.57,450,232.5S352.43,450,232.5,450z'/%3E",
  "%3Cpath d='M232.5,412.5c-99.252,0-180-80.748-180-180c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5 c0,52.127,20.272,101.107,57.083,137.917c36.81,36.81,85.79,57.083,137.917,57.083c4.143,0,7.5-3.358,7.5-7.5 S236.643,412.5,232.5,412.5z'/%3E",
  "%3Cpath d='M232.5,52.5c42.792,0,84.245,15.24,116.722,42.912c1.412,1.203,3.141,1.792,4.86,1.792c2.121,0,4.229-0.895,5.713-2.636 c2.687-3.153,2.308-7.887-0.845-10.573C323.762,54.012,278.854,37.5,232.5,37.5c-4.143,0-7.5,3.358-7.5,7.5 S228.357,52.5,232.5,52.5z'/%3E",
  "%3Cpath d='M381.008,106.053c-2.687-3.153-7.42-3.531-10.573-0.845c-3.152,2.687-3.531,7.42-0.845,10.573 c27.671,32.477,42.91,73.928,42.91,116.719c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5 C427.5,186.147,410.988,141.241,381.008,106.053z'/%3E",
  "%3Cpath d='M232.5,75c-4.143,0-7.5,3.358-7.5,7.5s3.357,7.5,7.5,7.5C311.075,90,375,153.925,375,232.5c0,4.142,3.357,7.5,7.5,7.5 s7.5-3.358,7.5-7.5c0-42.103-16.374-81.663-46.105-111.395S274.603,75,232.5,75z'/%3E",
  "%3Cpath d='M163.958,374.368c1.052,0.508,2.164,0.75,3.26,0.75c2.786,0,5.463-1.56,6.757-4.237c1.804-3.729,0.242-8.214-3.487-10.017 C120.841,336.86,90,287.675,90,232.5c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5c0,30.195,8.553,59.525,24.732,84.819 C115.482,341.941,137.691,361.668,163.958,374.368z'/%3E",
  "%3Cpath d='M232.5,375c-11.938,0-23.799-1.474-35.25-4.382c-4.012-1.02-8.096,1.409-9.115,5.424s1.409,8.096,5.424,9.115 C206.216,388.371,219.317,390,232.5,390c4.143,0,7.5-3.358,7.5-7.5S236.643,375,232.5,375z'/%3E",
  "%3Cpath d='M232.5,337.5c-29.979,0-58.59-12.839-78.499-35.224c-2.754-3.094-7.493-3.373-10.589-0.62 c-3.095,2.752-3.373,7.493-0.62,10.588c22.753,25.583,55.45,40.255,89.708,40.255c4.143,0,7.5-3.358,7.5-7.5 S236.643,337.5,232.5,337.5z'/%3E",
  "%3Cpath d='M131.624,289.889c1.117,0,2.252-0.25,3.321-0.78c3.712-1.837,5.232-6.336,3.395-10.048 c-7.192-14.534-10.84-30.199-10.84-46.561c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5c0,18.69,4.171,36.594,12.396,53.214 C126.204,288.357,128.861,289.889,131.624,289.889z'/%3E",
  "%3Cpath d='M232.5,112.5c-4.143,0-7.5,3.358-7.5,7.5s3.357,7.5,7.5,7.5c57.897,0,105,47.103,105,105c0,4.142,3.357,7.5,7.5,7.5 s7.5-3.358,7.5-7.5C352.5,166.332,298.668,112.5,232.5,112.5z'/%3E",
  "%3Cpath d='M232.5,212.5c-11.028,0-20,8.972-20,20s8.972,20,20,20s20-8.972,20-20S243.528,212.5,232.5,212.5z M232.5,237.5 c-2.757,0-5-2.243-5-5s2.243-5,5-5s5,2.243,5,5S235.257,237.5,232.5,237.5z'/%3E",
  "%3Cpath d='M232.5,149.5c-45.767,0-83,37.234-83,83s37.233,83,83,83s83-37.234,83-83S278.267,149.5,232.5,149.5z M232.5,300.5 c-37.495,0-68-30.505-68-68s30.505-68,68-68s68,30.505,68,68S269.995,300.5,232.5,300.5z'/%3E%3C/svg%3E",
].join(' ');

export async function GetDefaultPicBuffer(): Promise<BufferResponse> {
  if (!defaultPicBuffer) {
    defaultPicBuffer = {
      data: await fs.readFile(defaultPicPath),
      mimeType: 'image/svg+xml',
    };
  }
  return defaultPicBuffer;
}

export function GetDefaultPicUri(): string {
  return defaultPicUri;
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
