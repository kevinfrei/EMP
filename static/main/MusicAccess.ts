import * as persist from './persist';

import type { SongKey, Song, MusicDB, ArtistKey, Artist, AlbumKey, Album } from './MusicScanner';

export async function getMusicDB(): Promise<MusicDB | void> {
  try {
    const musicDB = await persist.getItemAsync<MusicDB>('DB');
    return musicDB;
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

export async function getAllPlaylists(): Promise<Map<string, SongKey[]> | void> {
  const musicDB = await getMusicDB();
  if (musicDB) {
    return musicDB.playlists;
  }
}
