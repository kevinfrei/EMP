import { FTON, MakeError, MakeLogger } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  SongKey,
} from '@freik/media-utils';
import { getMediaInfo } from './metadata';
import { MusicDB, MusicIndex, SearchResults, ServerSong } from './MusicScanner';
import * as persist from './persist';

const log = MakeLogger('MusicAccess');
const err = MakeError('MusicAccess-err');

let theMusicDatabase: MusicDB | null = null;
let theMusicIndex: MusicIndex | null = null;

/**
 * Read the Music Database *from persistence*. This does *not* re-scan locations
 * or any other stuff. It just handles un-flattening the data from storage.
 *
 * @async @function
 * @returns {Promise<MusicDB|void>} MusicDB or void
 */
export async function getMusicDB(): Promise<MusicDB | void> {
  if (!theMusicDatabase) {
    try {
      log('get-music-db called');
      const musicDBstr = await persist.getItemAsync('musicDatabase');
      if (musicDBstr) {
        log(`get-music-db: ${musicDBstr.length} bytes in the JSON blob.`);
        theMusicDatabase = (FTON.parse(musicDBstr) as unknown) as MusicDB;
        log(theMusicDatabase);
        return theMusicDatabase;
      }
      log('get-music-db result is empty');
    } catch (e) {
      err('get-music-db exception:');
      err(e);
      const emptyDB: MusicDB = {
        songs: new Map<SongKey, ServerSong>(),
        albums: new Map<AlbumKey, Album>(),
        artists: new Map<ArtistKey, Artist>(),
        pictures: new Map<AlbumKey, string>(),
        albumTitleIndex: new Map<string, AlbumKey[]>(),
        artistNameIndex: new Map<string, ArtistKey>(),
      };
      await persist.setItemAsync('musicDatabase', FTON.stringify(emptyDB));
      return;
    }
  } else {
    return theMusicDatabase;
  }
}

export async function saveMusicDB(musicDB: MusicDB): Promise<void> {
  theMusicDatabase = musicDB;
  const asFT = FTON.asFTON(musicDB);
  if (asFT) {
    log(`Saving DB with ${musicDB.songs.size} songs`);
    await persist.setItemAsync('musicDatabase', FTON.stringify(asFT));
  } else {
    err("MusicDB isn't FTON data!");
  }
}

export async function getAllSongs(): Promise<Map<SongKey, ServerSong>> {
  log('get-all-songs called');
  const musicDB = await getMusicDB();
  if (musicDB) {
    log(`get-all-songs: ${musicDB.songs.size} total songs`);
    return musicDB.songs || new Map();
  }
  err('get-all-songs result is empty');
  return new Map();
}

export async function getAllArtists(): Promise<Map<ArtistKey, Artist>> {
  log('get-all-artists called');
  const musicDB = await getMusicDB();
  if (musicDB) {
    log(`get-all-artists: ${musicDB.artists.size} total artists`);
    return musicDB.artists;
  }
  err('get-all-artists result is empty');
  return new Map();
}

export async function getAllAlbums(): Promise<Map<AlbumKey, Album>> {
  log('get-all-albums called');
  const musicDB = await getMusicDB();
  if (musicDB) {
    log(`get-all-albums: ${musicDB.albums.size} total albums`);
    return musicDB.albums;
  }
  err('get-all-albums result is empty');
  return new Map();
}

export async function getMediaInfoForSong(
  key?: string,
): Promise<Map<string, string> | void> {
  if (!key || typeof key !== 'string') {
    return;
  }
  const musicDB = await getMusicDB();
  if (musicDB) {
    const song = musicDB.songs.get(key);
    if (song) {
      const data: Map<string, string> = await getMediaInfo(song.path);
      log(`Fetched the media info for ${song.path}:`);
      log(data);
      return data;
    }
  }
}

export function setMusicIndex(index: MusicIndex): void {
  theMusicIndex = index;
}

export function searchWholeWord(term?: string): Promise<SearchResults | void> {
  return new Promise((resolve) => {
    if (!theMusicIndex || !term) {
      log('theMusicIndex:' + (!theMusicIndex ? 'something' : 'empty'));
      log('term:' + (!term ? 'something' : 'empty'));
      resolve();
    } else {
      const songs: SongKey[] = [...theMusicIndex.songs(term)];
      const albums: AlbumKey[] = [...theMusicIndex.albums(term)];
      const artists: ArtistKey[] = [...theMusicIndex.artists(term)];
      log('songs:');
      log(songs);
      log('albums:');
      log(albums);
      log('artists:');
      log(artists);
      resolve({ songs, albums, artists });
    }
  });
}

export function searchSubstring(term?: string): Promise<SearchResults | void> {
  return new Promise((resolve) => {
    if (!theMusicIndex || !term) {
      log('theMusicIndex:' + (!theMusicIndex ? 'something' : 'empty'));
      log('term:' + (!term ? 'something' : 'empty'));
      resolve();
    } else {
      const songs = [...theMusicIndex.songs(term, true)];
      const albums = [...theMusicIndex.albums(term, true)];
      const artists = [...theMusicIndex.artists(term, true)];
      resolve({ songs, albums, artists });
    }
  });
}
