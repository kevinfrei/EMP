import { FTON, MakeError, MakeLogger } from '@freik/core-utils';
import { Album, AlbumKey, Artist, ArtistKey, SongKey } from '@freik/media-core';
import { AudioDatabase, MakeAudioDatabase } from './AudioDatabase';
import { getMediaInfo } from './metadata';
import { MusicDB, MusicIndex, SearchResults, ServerSong } from './MusicScanner';
import * as persist from './persist';

const log = MakeLogger('MusicAccess');
const err = MakeError('MusicAccess-err');

let theMusicDatabase: MusicDB | null = null;
let theMusicIndex: MusicIndex | null = null;

let theAudioDatabase: AudioDatabase | null = null;

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

export async function getAudioDatabase(): Promise<AudioDatabase> {
  if (!theAudioDatabase) {
    theAudioDatabase = await MakeAudioDatabase();
    theAudioDatabase.load();
  }
  return theAudioDatabase;
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

function intersect<T>(a: Set<T>, b: Iterable<T>): Set<T> {
  const res: Set<T> = new Set();
  for (const i of b) {
    if (a.has(i)) {
      res.add(i);
    }
  }
  return res;
}

/**
 * @param  {boolean} substr - true for mid-word substring searches, false for
 * only 'starts with' search
 * @param  {string} term - The space-separated list of words to search for
 * @returns 3 arrays (songs, albums, artists) that have words that begin with
 * all of the search terms
 */
function indexSearch(substr: boolean, terms: string): SearchResults {
  if (!theMusicIndex) {
    throw Error(
      "Don't call this function directly without initializing theMusicIndex",
    );
  }
  let first = true;
  let songs: Set<SongKey> = new Set();
  let albums: Set<AlbumKey> = new Set();
  let artists: Set<ArtistKey> = new Set();
  for (const t of terms.split(' ').map((s) => s.trim())) {
    if (t.length > 0) {
      const sng = theMusicIndex.songs(t, substr);
      const alb = theMusicIndex.albums(t, substr);
      const art = theMusicIndex.artists(t, substr);
      songs = first ? new Set(sng) : intersect(songs, sng);
      albums = first ? new Set(alb) : intersect(albums, alb);
      artists = first ? new Set(art) : intersect(artists, art);
      first = false;
    }
  }
  log('songs:');
  log(songs);
  log('albums:');
  log(albums);
  log('artists:');
  log(artists);
  return {
    songs: [...songs],
    albums: [...albums],
    artists: [...artists],
  };
}

export function searchWholeWord(term?: string): Promise<SearchResults | void> {
  return new Promise((resolve) => {
    if (!theMusicIndex || !term) {
      log('theMusicIndex:' + (!theMusicIndex ? 'something' : 'empty'));
      log('term:' + (!term ? 'something' : 'empty'));
      resolve();
    } else {
      resolve(indexSearch(false, term));
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
      resolve(indexSearch(true, term));
    }
  });
}
