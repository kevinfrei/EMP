import { AudioDatabase } from '@freik/audiodb';
import {
  MakeError,
  MakeLogger,
  MakeWaitingQueue,
  Pickle,
  SafelyUnpickle,
  Type,
} from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  isAlbumKey,
  isArtistKey,
  MediaKey,
  SongKey,
} from '@freik/media-core';
import { FileUtil } from '@freik/node-utils';
import albumArt from 'album-art';
import { ProtocolRequest } from 'electron';
import electronIsDev from 'electron-is-dev';
import { promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { GetAudioDB } from './AudioDatabase';
import { Persistence } from './persist';
import { BufferResponse, GetDefaultPicBuffer } from './protocols';

const log = MakeLogger('cover-art', true && electronIsDev);
const err = MakeError('cover-art-err');

async function shouldDownloadAlbumArtwork(): Promise<boolean> {
  return (await Persistence.getItemAsync('downloadAlbumArtwork')) === 'true';
}

async function shouldDownloadArtistArtwork(): Promise<boolean> {
  return (await Persistence.getItemAsync('downloadArtistArtwork')) === 'true';
}

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

async function getArtistImage(artist: string): Promise<string | void> {
  const attempt = await albumArt(artist);
  if (!attempt.startsWith('Error: No results found')) return attempt;
}

async function checkSet(name: string, key: string): Promise<boolean> {
  const bailData = await Persistence.getItemAsync(name);
  const skip =
    SafelyUnpickle(bailData || '""', Type.isSetOfString) || new Set<string>();
  return skip.has(key);
}

const setWriterWaiter = MakeWaitingQueue(1);

async function addToSet(name: string, key: string): Promise<void> {
  if (await setWriterWaiter.wait()) {
    try {
      const bailData = await Persistence.getItemAsync(name);
      const skip =
        SafelyUnpickle(bailData || '""', Type.isSetOfString) ||
        new Set<string>();
      skip.add(key);
      await Persistence.setItemAsync(name, Pickle(skip));
    } finally {
      setWriterWaiter.leave();
    }
  }
}

// Try to find an album title match, trimming off ending junk of the album title
async function LookForAlbum(
  artist: string,
  album: string,
): Promise<string | void> {
  log(`Finding album art for ${artist}: ${album}`);
  let albTrim = album.trim();
  let lastAlbum: string;

  // Let's see if we should stop looking for this album
  if (
    await checkSet('noMoreLooking', `${artist}/${albTrim}`.toLocaleLowerCase())
  ) {
    return;
  }
  do {
    try {
      const attempt = await getArt(artist, albTrim);
      if (attempt) {
        log(`Got album art for ${artist}: ${album} [${albTrim}]`);
        return attempt;
      }
    } catch (e) {
      log(`Failed album attempt ${albTrim}`);
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

  await addToSet(
    'noMoreLooking',
    `${artist}/${album.trim()}`.toLocaleLowerCase(),
  );
}

// Try to find an artist match
async function LookForArtist(artist: string): Promise<string | void> {
  log(`Finding artist art for ${artist}`);

  // Let's see if we should stop looking for this artist
  const bailData = await Persistence.getItemAsync('noMoreLookingArtist');
  const skip =
    SafelyUnpickle(bailData || '""', Type.isSetOfString) || new Set<string>();
  if (skip.has(artist.toLocaleLowerCase())) {
    return;
  }
  try {
    const attempt = await getArtistImage(artist);
    if (attempt) {
      log(`Got artist art for ${artist}`);
      return attempt;
    }
  } catch (e) {
    log(`Failed artist attempt ${artist}`);
  }

  // Record the failure, so we stop looking...
  skip.add(artist.toLocaleLowerCase());
  await Persistence.setItemAsync('noMoreLookingArtist', Pickle(skip));
}

async function getPictureFromDB(
  db: AudioDatabase,
  id: MediaKey,
): Promise<void | Buffer> {
  if (isAlbumKey(id)) {
    log(`Found album art for ${id}`);
    return await db.getAlbumPicture(id);
  } else if (isArtistKey(id)) {
    log(`Found artist art for ${id}`);
    return await db.getArtistPicture(id);
  }
}

async function tryToDownloadAlbumCover(
  db: AudioDatabase,
  id: AlbumKey,
): Promise<Buffer | void> {
  const album = db.getAlbum(id);
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
          log('Got album data from teh interwebs');
          await SavePicForAlbum(db, album, data);
          return data;
        }
      }
    }
  }
}

async function tryToDownloadArtistImage(
  db: AudioDatabase,
  id: ArtistKey,
): Promise<Buffer | void> {
  const artist = db.getArtist(id);
  if (artist) {
    // Nothing in the files, let's see if we're supposed to download
    if (await shouldDownloadArtistArtwork()) {
      const res = await LookForArtist(artist.name);
      log(`${artist.name}:`);
      if (res) {
        log(res);
        const data = await httpsDownloader(res);
        log('Got artist data from teh interwebs');
        await SavePicForArtist(db, artist, data);
        return data;
      }
    }
  }
}

export async function PictureHandler(
  req: ProtocolRequest,
  id: MediaKey,
): Promise<BufferResponse> {
  // Check to see if there's a song in the album that has a cover image
  try {
    const db = await GetAudioDB();

    // log(`Got a request for ${id}`);
    if (id.lastIndexOf('#') !== -1) {
      id = id.substr(0, id.lastIndexOf('#'));
    }
    const maybePath = await getPictureFromDB(db, id);
    if (maybePath) {
      log(`Returning ${maybePath.length} bytes`);
      return {
        data: maybePath,
      };
    }
    if (isAlbumKey(id)) {
      const data = await tryToDownloadAlbumCover(db, id);
      if (data) {
        return { data };
      }
    } else if (isArtistKey(id)) {
      const data = await tryToDownloadArtistImage(db, id);
      if (data) {
        return { data };
      }
    }
  } catch (error) {
    log(`Error while trying to get picture for ${id}`);
    log(error);
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
          await FileUtil.hideFile(albumPath);
        }
      } catch (e) {
        err('Saving picture failed :(');
        err(e);
      }
    }
  }
  log('Saving to blob store');
  await db.setAlbumPicture(album.key, data);
}

async function SavePicForArtist(
  db: AudioDatabase,
  artist: Artist,
  data: Buffer,
) {
  log('Saving to blob store');
  await db.setArtistPicture(artist.key, data);
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
  await db.setAlbumPicture(albumKey, Buffer.from(arg.nativeImage));
  return '';
}
