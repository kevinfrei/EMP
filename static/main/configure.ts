import { Logger } from '@freik/core-utils';
import { AlbumKey, SongKey } from '@freik/media-utils';
import { protocol, ProtocolRequest, ProtocolResponse } from 'electron';
import path from 'path';
import { getMusicDB } from './MusicAccess';
import * as persist from './persist';
import { CreateMusicDB } from './Startup';

declare type HandlerCallback = (response: string | ProtocolResponse) => void;

const log = Logger.bind('configure');
Logger.enable('configure');

const defaultPicPath = { path: path.join(__dirname, '..', 'img-album.svg') };

async function picProcessor(
  req: ProtocolRequest,
  trimmedUrl: string,
): Promise<ProtocolResponse | string> {
  // Check to see if there's a song in the album that has a cover image
  const albumId: AlbumKey = trimmedUrl;
  const db = await getMusicDB();
  if (!db) {
    return defaultPicPath;
  }
  const maybePath = db.pictures.get(albumId);
  if (maybePath) {
    return { path: maybePath };
  }
  return defaultPicPath;
}

const e404 = { error: 404 };

const audioMimeTypes = new Map<string, string>([
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/m4a'],
  ['.aac', 'audio/aac'],
  ['.flac', 'audio/x-flac'],
  ['.wma', 'audio/x-ms-wma'],
]);

async function tuneProcessor(
  req: ProtocolRequest,
  trimmedUrl: string,
): Promise<ProtocolResponse | string> {
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

// Helper to check URL's & transition to async functions
function registerProtocol(
  type: string,
  processor: (
    req: ProtocolRequest,
    trimmedUrl: string,
  ) => Promise<string | ProtocolResponse>,
  defaultValue: string | ProtocolResponse = e404,
) {
  const protName = type.substr(0, type.indexOf(':'));
  log(`Protocol ${type} (${protName})`);
  protocol.registerFileProtocol(
    protName,
    (req: ProtocolRequest, callback: HandlerCallback) => {
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
    },
  );
}

// This sets up all protocol handlers
export function configureProtocols(): void {
  registerProtocol('pic://album/', picProcessor, defaultPicPath);
  registerProtocol('tune://song/', tuneProcessor);
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
