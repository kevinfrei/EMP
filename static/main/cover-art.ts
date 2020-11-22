import { MakeError, MakeLogger } from '@freik/core-utils';
import { Album, Cover } from '@freik/media-utils';
import albumArt from 'album-art';
import { ProtocolRequest } from 'electron';
import { promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { BufferResponse, getDefaultPicBuffer } from './conf-protocols';
import { getMusicDB, saveMusicDB } from './MusicAccess';
import { MusicDB } from './MusicScanner';
import * as persist from './persist';

const log = MakeLogger('cover-art');
const err = MakeError('cover-art-err');

async function shouldDownloadAlbumArtwork(): Promise<boolean> {
  return (await persist.getItemAsync('downloadAlbumArtwork')) === 'true';
}

// TODO: This isn't used anywhere... yet...
async function shouldDownloadArtistArtwork(): Promise<boolean> {
  return (await persist.getItemAsync('downloadArtistArtwork')) === 'true';
}

async function shouldSaveAlbumArtworkWithMusicFiles(): Promise<boolean> {
  return (await persist.getItemAsync('saveAlbumArtworkWithMusic')) === 'true';
}

async function albumCoverName(): Promise<string> {
  const val = await persist.getItemAsync('albumCoverName');
  return val || '.CoverArt';
}

function httpsDownloader(url: string): Promise<Buffer> {
  const buf: Uint8Array[] = [];
  return new Promise((resolve) => {
    https.get(new URL(url), (res) => {
      res.on('data', (d: Uint8Array) => buf.push(d));
      res.on('end', () => resolve(Buffer.concat(buf)));
    });
  });
}

async function getArt(album: string, artist: string): Promise<string | void> {
  const attempt = await albumArt(artist, { album, size: 'large' });
  if (!attempt.startsWith('Error: No results found')) return attempt;
}

// Try to find an album title match, trimming off ending junk of the album title
async function LookForAlbum(
  artist: string,
  album: string,
): Promise<string | void> {
  log(`Finding art for ${artist}: ${album}`);
  let albTrim = album.trim();
  let lastAlbum: string;
  do {
    try {
      const attempt = await getArt(artist, albTrim);
      if (attempt) {
        log(`Got art for ${artist}: ${album} [${albTrim}]`);
        return attempt;
      }
    } catch (e) {
      log(`Failed attempt ${albTrim}`);
    }
    lastAlbum = albTrim;
    for (const pair of ['()', '[]', '{}']) {
      if (albTrim.endsWith(pair[1]) && albTrim.indexOf(pair[0]) > 0) {
        albTrim = albTrim.substr(0, albTrim.lastIndexOf(pair[0])).trim();
        break;
      }
    }
  } while (lastAlbum !== albTrim);
}

export async function picBufProcessor(
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
        };
      }
      // This pulls the image from the file metadata
      const album = db.albums.get(albumId);
      if (album) {
        // TODO: Wire this up to FlushImageCache();
        // TODO: Cache/save this somewhere, so we don't keep reading loads-o-files
        for (const songKey of album.songs) {
          const song = db.songs.get(songKey);
          if (song) {
            log(`Looking for cover in ${song.path}`);
            const buf = await Cover.readFromFile(song.path);
            if (buf) {
              log(`Got a buffer ${buf.data.length} bytes long`);
              const data = Buffer.from(buf.data, 'base64');
              await SavePicForAlbum(db, album, data);
              return { data };
            }
          }
        }
        if (await shouldDownloadAlbumArtwork()) {
          // We didn't find something.
          // Let's use the albumArt package
          const artist = db.artists.get(album.primaryArtists[0]);
          if (artist) {
            const res = await LookForAlbum(artist.name, album.title);
            log(`${artist.name}: ${album.title}`);
            if (res) {
              log(res);
              const data = await httpsDownloader(res);
              log('Got data from teh interwebs');
              await SavePicForAlbum(db, album, data);
              return { data };
            }
          }
        }
      }
    }
  } catch (error) {
    log(`Error while trying to get picture for ${albumId}`);
    // log(error);
  }
  return await getDefaultPicBuffer();
}

let timeout: NodeJS.Timeout | null = null;

async function SavePicForAlbum(db: MusicDB, album: Album, data: Buffer) {
  const songKey = album.songs[0];
  const song = db.songs.get(songKey);
  if (song) {
    if (await shouldSaveAlbumArtworkWithMusicFiles()) {
      const coverName = await albumCoverName();
      // TODO: This file type may not be correct. Check the data buffer!
      const albumPath = path.join(path.dirname(song.path), `${coverName}.jpg`);
      try {
        log('Saving to path: ' + albumPath);
        await fs.writeFile(albumPath, data);
        log('And, saved it to disk!');
        db.pictures.set(album.key, albumPath);
        // Delay saving the Music DB, so that we're not doing it a gazillion
        // times during DB scanning
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          log('saving the DB to disk');
          saveMusicDB(db).catch((rej) => log('Error saving'));
        }, 1000);
        return;
      } catch (e) {
        err('Saving picture failed :(');
        err(e);
        // TODO: Make a cache for read-only music shares!
        // This would be useful for being able to annotate/"edit" music
        // metadata in the same situation...
      }
    } else {
      // TODO: Save these files locally somewhere we look during the normal
      // file scanning process
    }
  }
}

export function FlushImageCache(): Promise<void> {
  err('FlushImageCache NYI');
  // TODO: Make this do something
  return new Promise((res) => {
    err('FlushImageCache NYI (really!)');
  });
}
