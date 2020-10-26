import { MakeLogger } from '@freik/core-utils';
import { Album, Cover } from '@freik/media-utils';
import albumArt from 'album-art';
import { ProtocolRequest } from 'electron';
import { promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { BufferResponse, getDefaultPicBuffer } from './conf-protocols';
import { getMusicDB, saveMusicDB } from './MusicAccess';
import { MusicDB } from './MusicScanner';

const log = MakeLogger('cover-art');

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
  let lastAlbum;
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
          const res = await LookForAlbum(artist.name, album.title);
          log(`${artist.name}: ${album.title}`);
          if (res) {
            log(res);
            const data = await httpsDownloader(res);
            log('Got data from teh interwebs');
            SavePicForAlbum(db, album, data);
            return { data };
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

function SavePicForAlbum(db: MusicDB, album: Album, data: Buffer) {
  const songKey = album.songs[0];
  const song = db.songs.get(songKey);
  if (song) {
    log('Got a song:');
    log(song);
    const albumPath = path.join(path.dirname(song.path), '.AlbumCover.jpg');
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
        // TODO: Make a cache for read-only music shares!
        // This would be useful for being able to annotate/"edit" music
        // metadata in the same situation...
      });
  }
}
