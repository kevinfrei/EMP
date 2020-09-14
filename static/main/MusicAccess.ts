import { FTON, Logger } from '@freik/core-utils';

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
    const musicDBstr = await persist.getItemAsync('DB');
    if (musicDBstr) {
      return (FTON.parse(musicDBstr) as unknown) as MusicDB;
    }
  } catch (e) {
    return;
  }
}

export async function getAllSongs(): Promise<Map<SongKey, Song> | void> {
  const musicDB = await getMusicDB();
  if (musicDB) {
    return musicDB.songs;
  }
}

export async function getAllArtists(): Promise<Map<ArtistKey, Artist> | void> {
  const musicDB = await getMusicDB();
  if (musicDB) {
    return musicDB.artists;
  }
}

export async function getAllAlbums(): Promise<Map<AlbumKey, Album> | void> {
  const musicDB = await getMusicDB();
  if (musicDB) {
    return musicDB.albums;
  }
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
