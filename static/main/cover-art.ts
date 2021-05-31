import {
  MakeError,
  MakeLogger,
  Pickle,
  SafelyUnpickle,
  Type,
} from '@freik/core-utils';
import { Album, AlbumKey, SongKey } from '@freik/media-core';
import { hideFile } from '@freik/node-utils/lib/file';
import albumArt from 'album-art';
import { AudioDatabase } from 'audio-database';
import { ProtocolRequest } from 'electron';
import electronIsDev from 'electron-is-dev';
import { promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { GetAudioDB } from './AudioDatabase';
import { Persistence } from './persist';
import { BufferResponse, GetDefaultPicBuffer } from './protocols';

const log = MakeLogger('cover-art', false && electronIsDev);
const err = MakeError('cover-art-err');

async function shouldDownloadAlbumArtwork(): Promise<boolean> {
  return (await Persistence.getItemAsync('downloadAlbumArtwork')) === 'true';
}

// TODO: This isn't used anywhere... yet...
/*
async function shouldDownloadArtistArtwork(): Promise<boolean> {
  return (await Persistence.getItemAsync('downloadArtistArtwork')) === 'true';
}
*/

async function shouldSaveAlbumArtworkWithMusicFiles(): Promise<boolean> {
  return (
    (await Persistence.getItemAsync('saveAlbumArtworkWithMusic')) === 'true'
  );
}

async function albumCoverName(): Promise<string> {
  const val = await Persistence.getItemAsync('albumCoverName');
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

  // Let's see if we should stop looking for this album
  const bailData =
    (await Persistence.getItemAsync('noMoreLooking')) ||
    '{"@dataType":"Set","@dataValue":[]}';
  const skip = SafelyUnpickle(bailData, Type.isSetOfString);
  if (Type.isSetOfString(skip) && skip.has(albTrim)) {
    return;
  }
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
      } else {
        const ind = albTrim.lastIndexOf(pair[0]);
        if (ind > 0) {
          // Maybe the stuff got cut off, let's just trim it anyway
          albTrim = albTrim.substr(0, ind).trim();
          break;
        }
      }
    }
  } while (lastAlbum !== albTrim);

  // Record the failure, so we stop looking...
  const newSkip: Set<string> = Type.isSetOfString(skip) ? skip : new Set();
  newSkip.add(albTrim);
  await Persistence.setItemAsync('noMoreLooking', Pickle(newSkip));
}

export async function PicBufProtocolHandler(
  req: ProtocolRequest,
  albumId: string,
): Promise<BufferResponse> {
  // Check to see if there's a song in the album that has a cover image
  try {
    const db = await GetAudioDB();

    log(`Got a request for ${albumId}`);
    if (albumId.lastIndexOf('#') !== -1) {
      albumId = albumId.substr(0, albumId.lastIndexOf('#'));
    }
    const maybePath = await db.getAlbumPicture(albumId);
    if (maybePath) {
      log(`Returning ${maybePath.length} bytes`);
      return {
        data: maybePath,
      };
    }
    const album = db.getAlbum(albumId);
    if (album) {
      // Nothing in the files, let's see if we're supposed to download
      if (await shouldDownloadAlbumArtwork()) {
        const artist = db.getArtist(album.primaryArtists[0]);
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
  } catch (error) {
    log(`Error while trying to get picture for ${albumId}`);
    // log(error);
  }
  return await GetDefaultPicBuffer();
}

async function SavePicForAlbum(
  db: AudioDatabase,
  album: Album,
  data: Buffer,
  overridePref?: boolean,
) {
  const songKey = album.songs[0];
  const song = db.getSong(songKey);
  if (song) {
    if (overridePref || (await shouldSaveAlbumArtworkWithMusicFiles())) {
      const coverName = await albumCoverName();
      // This is pretty dumb, but it works for PNG's and assumes all else is JPG
      const first4bytes = data.readInt32BE(0);
      const suffix = first4bytes === 0x89504e47 ? '.png' : '.jpg';
      const albumPath = path.join(
        path.dirname(song.path),
        `${coverName}${suffix}`,
      );
      try {
        log('Saving to path: ' + albumPath);
        await fs.writeFile(albumPath, data);
        if (coverName.startsWith('.')) {
          await hideFile(albumPath);
        }
        log('And, saved it to disk!');
        await db.setAlbumPicture(album.key, albumPath);
        // Delay saving the Music DB, so that we're not doing it a gazillion
        // times during DB scanning
        // TODO: Do we need to save?
        /*
        if (dbSaveDebounceTimer !== null) {
          clearTimeout(dbSaveDebounceTimer);
        }
        dbSaveDebounceTimer = setTimeout(() => {
          log('saving the DB to disk');
          saveMusicDB(db).catch((rej) => log('Error saving'));
        }, 1000);
        return;*/
      } catch (e) {
        err('Saving picture failed :(');
        err(e);
      }
    }
  }
  // We tried to save it with a song in the album, no such luck
  // Save it in the cache
  // TODO: Check in on this
  // await AlbumCoverCache().put(data, album);
}

export type AlbumCoverData =
  | {
      songKey: SongKey;
      nativeImage: Uint8Array;
    }
  | {
      albumKey: AlbumKey;
      nativeImage: Uint8Array;
    };

export function isAlbumCoverData(arg: unknown): arg is AlbumCoverData {
  return (
    Type.hasStr(arg, 'songKey') !== Type.hasStr(arg, 'albumKey') &&
    Type.has(arg, 'nativeImage') &&
    arg.nativeImage instanceof Uint8Array
  );
}

// TODO: Fix this to work properly...
export async function SaveNativeImageForAlbum(
  arg: AlbumCoverData,
): Promise<string> {
  const db = await GetAudioDB();
  let albumKey;
  if (Type.hasStr(arg, 'albumKey')) {
    albumKey = arg.albumKey;
  } else {
    const song = db.getSong(arg.songKey);
    if (song) {
      albumKey = song.albumId;
    }
  }
  if (!albumKey) {
    return 'Failed to find albumKey';
  }
  await db.setAlbumPicture(albumKey, "this-isn't-a-path");
  //  await SavePicForAlbum(db, album, Buffer.from(arg.nativeImage));
  return '';
}
