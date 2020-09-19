import { FTON, FTONData, Logger } from '@freik/core-utils';

import * as persist from './persist';
import { getMediaInfo } from './metadata';

import type {
  SongKey,
  Song,
  MusicDB,
  ArtistKey,
  Artist,
  AlbumKey,
  Album,
  MediaInfo,
} from './MusicScanner';

const log = Logger.bind('MusicAccess');
Logger.enable('MusicAccess');

export async function getMusicDB(): Promise<MusicDB | void> {
  try {
    log('get-music-db called');
    const musicDBstr = await persist.getItemAsync('DB');
    if (musicDBstr) {
      log(`get-music.db: ${musicDBstr.length} bytes in the JSON blob.`);
      return (FTON.parse(musicDBstr) as unknown) as MusicDB;
    }
    log('get-music-db result is empty');
  } catch (e) {
    log('get-music-db exception:');
    log(e);
    return;
  }
}

export async function getSongKeys(): Promise<string> {
  const musicDB = await getMusicDB();
  if (!musicDB) return '';
  return [...musicDB.songs.keys()].join(';');
}

export async function getSongByKey(songKey: SongKey): Promise<Song | void> {
  const musicDb = await getMusicDB();
  if (!musicDb) return;
  return musicDb.songs.get(songKey);
}

export async function getAllSongs(): Promise<FTONData | void> {
  log('get-all-songs called');
  const musicDB = await getMusicDB();
  if (musicDB) {
    log(`get-all-songs: ${musicDB.songs.size} total songs`);
    return FTON.stringify(musicDB.songs);
  }
  log('get-all-songs result is empty');
}

export async function getAllArtists(): Promise<Map<ArtistKey, Artist> | void> {
  log('get-all-artists called');
  const musicDB = await getMusicDB();
  if (musicDB) {
    log(`get-all-artists: ${musicDB.artists.size} total artists`);
    return musicDB.artists;
  }
  log('get-all-artists result is empty');
}

export async function getAllAlbums(): Promise<Map<AlbumKey, Album> | void> {
  log('get-all-albums called');
  const musicDB = await getMusicDB();
  if (musicDB) {
    log(`get-all-albums: ${musicDB.albums.size} total albums`);
    return musicDB.albums;
  }
  log('get-all-albums result is empty');
}

export async function getAllPlaylists(): Promise<Map<
  string,
  SongKey[]
> | void> {
  const musicDB = await getMusicDB();
  if (musicDB) {
    return musicDB.playlists;
  }
}

export async function getMediaInfoForSong(
  key: string,
): Promise<MediaInfo | void> {
  if (typeof key !== 'string') {
    return;
  }
  const musicDB = await getMusicDB();
  if (musicDB) {
    const song = musicDB.songs.get(key);
    if (song) {
      const data: MediaInfo = await getMediaInfo(song.path);
      log(`Fetched the media info for ${song.path}:`);
      log(data);
      return data;
    }
  }
}
