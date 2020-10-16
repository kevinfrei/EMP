import { MakeLogger } from '@freik/core-utils';
import { Album, Cover, SongKey } from '@freik/media-utils';
import albumArt from 'album-art';
import { protocol, ProtocolRequest, ProtocolResponse } from 'electron';
import { promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { getMusicDB, saveMusicDB } from './MusicAccess';
import { MusicDB } from './MusicScanner';
import * as persist from './persist';
import { CreateMusicDB } from './Startup';

declare type FileResponse = string | ProtocolResponse;
declare type BufferResponse = Buffer | ProtocolResponse;

const log = MakeLogger('configure', true);

function httpsDownloader(url: string): Promise<Buffer> {
  const buf: Uint8Array[] = [];
  return new Promise((resolve, reject) => {
    https.get(new URL(url), (res) => {
      res.on('data', (d: Uint8Array) => buf.push(d));
      res.on('end', () => resolve(Buffer.concat(buf)));
    });
  });
}

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

let timeout: NodeJS.Timeout | null = null;

function SavePicForAlbum(db: MusicDB, album: Album, data: Buffer) {
  const songKey = album.songs[0];
  const song = db.songs.get(songKey);
  if (song) {
    log('Got a song:');
    log(song);
    const albumPath = path.join(path.dirname(song.path), 'folder.jpg');
    log('Saving to path: ' + albumPath);
    fs.writeFile(albumPath, data)
      .then(() => {
        log('And, saved it to disk!');
        db.pictures.set(album.key, albumPath);
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          log('saving the DB to disk');
          saveMusicDB(db).catch((rej) => log('Error saving'));
        }, 1000);
        // TODO: Re-save the music DB to disk!
      })
      .catch((err) => {
        log('Saving picture failed :(');
        log(err);
      });
  }
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
          // mimeType: imageMimeTypes.get(path.extname(maybePath)),
        };
      }
      // This pulls the image from the file metadata
      const album = db.albums.get(albumId);
      if (album) {
        // TODO: Cache/save this somewhere, so we don't keep reading loads-o-files
        for (const songKey of album.songs) {
          const song = db.songs.get(songKey);
          if (song) {
            log(`Looking for cover in ${song.path}`);
            const buf = await Cover.readFromFile(song.path);
            if (buf) {
              log(`Got a buffer ${buf.data.length} bytes long`);
              const data = Buffer.from(buf.data, 'base64');
              SavePicForAlbum(db, album, data);
              return { data };
            }
          }
        }
        // We didn't find something.
        // Let's use the albumArt package
        const artist = db.artists.get(album.primaryArtists[0]);
        if (artist) {
          const res = await albumArt(artist.name, {
            album: album.title,
            size: 'large',
          });
          log(`${artist.name}: ${album.title}`);
          log(res);
          const data = await httpsDownloader(res);
          log('Got data from teh interwebs');
          SavePicForAlbum(db, album, data);
          return { data };
        }
      }
    }
  } catch (error) {
    log(`Error while trying to get picture for ${albumId}`);
    // log(error);
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
