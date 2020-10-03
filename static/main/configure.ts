import { Logger } from '@freik/core-utils';
import { SongKey } from '@freik/media-utils';
import { protocol, ProtocolRequest, ProtocolResponse } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { getMusicDB } from './MusicAccess';
import * as persist from './persist';
import { CreateMusicDB } from './Startup';

declare type FileResponse = string | ProtocolResponse;
declare type BufferResponse = Buffer | ProtocolResponse;

const log = Logger.bind('configure');
// Logger.enable('configure');

const audioMimeTypes = new Map<string, string>([
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/m4a'],
  ['.aac', 'audio/aac'],
  ['.flac', 'audio/x-flac'],
  ['.wma', 'audio/x-ms-wma'],
]);

const imageMimeTypes = new Map<string, string>([
  ['.jpg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
]);

const defaultPicPath = path.join(__dirname, '..', 'img-album.svg');
let defaultPicBuffer: BufferResponse | null = null;
async function getDefaultPicBuffer(): Promise<BufferResponse> {
  if (!defaultPicBuffer) {
    defaultPicBuffer = {
      data: await fs.readFile(defaultPicPath),
      mimeType: imageMimeTypes.get('.svg'),
    };
  }
  return defaultPicBuffer;
}

async function picBufProcessor(
  req: ProtocolRequest,
  albumId: string,
): Promise<BufferResponse> {
  // Check to see if there's a song in the album that has a cover image
  try {
    const db = await getMusicDB();
    if (db) {
      const maybePath = db.pictures.get(albumId);
      if (maybePath) {
        return {
          data: await fs.readFile(maybePath),
          mimeType: imageMimeTypes.get(path.extname(maybePath)),
        };
      } /*
      const album = db.albums.get(albumId);
      if (album) {
        // TODO: Cache/save this somewhere, so we don't keep reading loads-o-files
        for (const songKey of album.songs) {
          const song = db.songs.get(songKey);
          if (song) {
            log(`Looking for cover in ${song.path}`);
            const buf = await Cover.readFromFile(song.path);
            if (buf) {
              log(buf);
              return {
                data: Buffer.from(buf.data, 'base64'),
                mimeType: buf.type,
              };
            }
          }
        }
      }
      */
    }
  } catch (error) {
    log(`Error while trying to get picture for ${albumId}`);
    log(error);
  }

  return await getDefaultPicBuffer();
}

const e404 = { error: 404 };

async function tuneProcessor(
  req: ProtocolRequest,
  trimmedUrl: string,
): Promise<FileResponse> {
  const key: SongKey = trimmedUrl;
  const db = await getMusicDB();
  if (!db) {
    return e404;
  }
  const song = db.songs.get(key);
  if (song) {
    const thePath = song.path;
    log('Returning file read from ' + thePath);
    const mimeType =
      audioMimeTypes.get(path.extname(thePath).toLowerCase()) ?? 'audio/mpeg';
    return { path: thePath, mimeType };
  } else {
    return e404;
  }
}

type Registerer<T> = (
  scheme: string,
  handler: (
    request: ProtocolRequest,
    callback: (response: T | ProtocolResponse) => void,
  ) => void,
) => boolean;

// Helper to check URL's & transition to async functions
function registerProtocolHandler<ResponseType>(
  type: string,
  registerer: Registerer<ResponseType>,
  processor: (
    req: ProtocolRequest,
    trimmedUrl: string,
  ) => Promise<ProtocolResponse | ResponseType>,
  defaultValue: ProtocolResponse | ResponseType = e404,
) {
  const protName = type.substr(0, type.indexOf(':'));
  log(`Protocol ${type} (${protName})`);
  registerer(protName, (req, callback) => {
    log(`${type} URL request:`);
    log(req);
    if (!req.url) {
      callback({ error: -324 });
    } else if (req.url.startsWith(type)) {
      processor(req, req.url.substr(type.length))
        .then(callback)
        .catch((reason: any) => {
          log(`${type}:// failure`);
          log(reason);
          callback(defaultValue);
        });
    } else {
      callback(defaultValue);
    }
  });
}

// This sets up all protocol handlers
export function configureProtocols(): void {
  getDefaultPicBuffer()
    .then((val) =>
      // TODO: Enable both song & album pictures
      // folder-level photos are fine, but for song requests, check the song
      // then fall back to the album
      registerProtocolHandler(
        'pic://album/',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        protocol.registerBufferProtocol,
        picBufProcessor,
        val,
      ),
    )
    .catch((reason) => {
      log('Unable to register pic:// handling');
      log(reason);
    });
  registerProtocolHandler(
    'tune://song/',
    // eslint-disable-next-line @typescript-eslint/unbound-method
    protocol.registerFileProtocol,
    tuneProcessor,
  );
}

// This sets up reactive responses to changes, for example:
// locations change, so music needs to be rescanned
export function configureListeners(): void {
  persist.subscribe('locations', (newLocationsValue) => {
    log('Locations updated: About to re-scan music');
    // If locations changed, update the music database

    /*
     * TODO: Even though the selectors in the render process all depend upon
     * locations, this update doesn't register before the render process has
     * already grabbed the previous music DB. There needs to be some sort of
     * Locations-based hash to ensure that a request isn't fulfilled until the
     * rest of the data has been received
     */

    CreateMusicDB()
      .then(() => log('DB Updated!'))
      .catch((r) => log('DB Update failed'));
  });
}
