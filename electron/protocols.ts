import { SongWithPath } from '@freik/audiodb';
import { Persistence } from '@freik/electron-main';
import { MakeLog } from '@freik/logger';
import { SongKey } from '@freik/media-core';
import { asString, hasStrField } from '@freik/typechk';
import { net, protocol } from 'electron';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { GetAudioDB, UpdateAudioLocations } from './AudioDatabase';
import { PictureHandler } from './cover-art';

const fsp = fs.promises;

const { log, err } = MakeLog('EMP:main:protocols');
log.enabled = true;
/*
export type FileResponse = string | ProtocolResponse;
export type BufferResponse = Buffer | ProtocolResponse;
*/
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

let defaultAlbumPicResponse: Response | null = null;
let defaultAlbumPicBuffer: Buffer | null = null;
let defaultAlbumPicUri: string | null = null;

async function GetDefaultAlbumPicBuffer(): Promise<Buffer> {
  if (!defaultAlbumPicBuffer) {
    defaultAlbumPicBuffer = await fsp.readFile(defaultAlbumPicPath());
  }
  return defaultAlbumPicBuffer;
}

export async function GetDefaultAlbumPicResponse(): Promise<Response> {
  if (!defaultAlbumPicResponse) {
    const b = await GetDefaultAlbumPicBuffer();
    const ab: ArrayBuffer = b.buffer.slice(
      b.byteOffset,
      b.byteOffset + b.byteLength,
    );
    defaultAlbumPicResponse = new Response(ab);
  }
  return defaultAlbumPicResponse;
}

export async function GetDefaultAlbumPicUri(): Promise<string> {
  if (!defaultAlbumPicUri) {
    const br = await GetDefaultAlbumPicBuffer();
    let svg = br.toString();
    // Remove space from between tags, duplicate spaces
    svg = svg.replace(/>\s{1,}</g, '><');
    svg = svg.replace(/\s{1,}\/>/g, '/>');
    svg = svg.replace(/\s{2,}/g, ' ');
    svg = svg.trim();
    // Encode the uri-unsafe characters
    svg = svg.replace(/[%#<>?\[\\\]^`{|}]/g, encodeURIComponent);
    defaultAlbumPicUri = `data:image/svg+xml,${svg}`;
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

let defaultArtistPicBuffer: Response | null = null;

export async function GetDefaultArtistPicResponse(): Promise<Response> {
  if (!defaultArtistPicBuffer) {
    const b = await fsp.readFile(defaultArtistPicPath());
    const ab: ArrayBuffer = b.buffer.slice(
      b.byteOffset,
      b.byteOffset + b.byteLength,
    );
    defaultArtistPicBuffer = new Response(ab);
  }
  return defaultArtistPicBuffer;
}

const e404: Response = new Response(new ArrayBuffer(0), {
  status: 404,
  statusText: 'Not Found',
});

// This function deals with .emp files
async function getRealFile(
  song: SongWithPath,
): Promise<{ extension: string; thePath: string }> {
  let thePath = song.path;
  log('Returning file read from ' + thePath);
  let extension = path.extname(thePath).toLowerCase();
  if (extension === '.emp') {
    // For an .emp file, read the contents to get to the *actual* file
    try {
      const empFile = (await fsp.readFile(thePath)).toString();
      try {
        const thePtr: unknown = JSON.parse(empFile);
        if (hasStrField(thePtr, 'original')) {
          if (path.isAbsolute(thePtr.original)) {
            throw new Error(".emp 'original' field must be relative");
          }
          thePath = path.resolve(path.dirname(thePath), thePtr.original);
          extension = path.extname(thePath).toLowerCase();
        } else {
          throw new Error(".emp file missing 'original' field");
        }
      } catch (e) {
        err(e);
        err('Invalid .emp file format:');
        err(empFile);
      }
    } catch (e) {
      err(e);
      err('Probably missing file from .emp file:');
      err(thePath);
    }
  }
  return { extension, thePath };
}

async function tuneProtocolHandler(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  const key: SongKey = pathname.substring(1);
  log(`SongKey: ${key}`);
  const db = await GetAudioDB();
  const song = db.getSong(key);
  if (song) {
    const { extension, thePath } = await getRealFile(song);
    const mimeType = audioMimeTypes.get(extension) ?? 'audio/mpeg';
    const url = pathToFileURL(thePath);
    log('Trying to send file:');
    log(`${thePath} (${extension} : ${mimeType})`);
    try {
      return net.fetch(
        url.href /* {
        headers: {
          'Content-Type': mimeType, // eslint-disable-line @typescript-eslint/naming-convention
          'Content-Disposition': 'inline', // eslint-disable-line @typescript-eslint/naming-convention
        },
      }*/,
      );
    } catch (e) {
      err(`Fetch of ${thePath} failed with error:`);
      err(e);
    }
  }
  log('Song not found');
  return e404;
}

export function RegisterPrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'tune',
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true, // Add this if you want to use fetch with this protocol.
        stream: true, // Add this if you intend to use the protocol for streaming i.e. in video/audio html tags.
        // corsEnabled: true, // Add this if you need to enable cors for this protocol.
      },
    },
  ]);
}

// This sets up all protocol handlers
export function RegisterProtocols(): void {
  // TODO: Enable both song & album pictures
  // folder-level photos are fine, but for song requests, check the song
  // then fall back to the album
  log('Registering pic://key/ protocol');
  protocol.handle('pic', PictureHandler);
  log('Registering tune://song/ protocol');
  protocol.handle('tune', tuneProtocolHandler);
  log('Finished protocol registration');
}

// This sets up reactive responses to changes, for example:
// locations change, so music needs to be rescanned
export function RegisterListeners(): void {
  Persistence.subscribe('locations', UpdateAudioLocations);
}
