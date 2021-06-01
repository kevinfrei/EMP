import {
  MakeError,
  MakeLogger,
  Operations,
  SafelyUnpickle,
  Type,
} from '@freik/core-utils';
import {
  isAlbumKey,
  isArtistKey,
  isSongKey,
  MediaKey,
  SongKey,
} from '@freik/media-core';
import {
  AudioDatabase,
  FlatAudioDatabase,
  GetMediaInfo,
  MakeAudioDatabase,
  MinimumMetadata,
  SearchResults,
} from 'audio-database';
import electronIsDev from 'electron-is-dev';
import { AsyncSend } from './Communication';
import { Persistence } from './persist';

const log = MakeLogger('AudioDatabase', true && electronIsDev);
const err = MakeError('AudioDatabase-err');

let theAudioDb: AudioDatabase | null;

export async function GetAudioDB(): Promise<AudioDatabase> {
  if (theAudioDb == null) {
    theAudioDb = await MakeAudioDatabase(Persistence);
  }
  return theAudioDb;
}

export async function GetSimpleMusicDatabase(): Promise<FlatAudioDatabase> {
  const db = await GetAudioDB();
  return db.getFlatDatabase();
}

export function SendDatabase(db: AudioDatabase): void {
  const flat = db.getFlatDatabase();
  log(
    `${flat.songs.length} songs, ` +
      `${flat.albums.length} albums,` +
      `${flat.artists.length} artists`,
  );
  AsyncSend({ 'music-database-update': flat });
}

export async function RescanAudioDatase(): Promise<void> {
  const db = await GetAudioDB();
  log('Rescanning the DB');
  await db.refresh();
  log('Rescanning complete');
  SendDatabase(db);
}

export async function UpdateLocations(locs: string): Promise<void> {
  try {
    const locations = SafelyUnpickle(locs, Type.isArrayOfString);
    if (!locations) {
      return;
    }
    const db = await GetAudioDB();
    const existingLocations = db.getLocations();
    const add = Operations.SetDifference(new Set(locations), existingLocations);
    const del = Operations.SetDifference(new Set(existingLocations), locations);
    log('Adding:');
    log(add);
    log('removing:');
    log(del);
    await Promise.all([...del].map((loc) => db.removeFileLocation(loc)));
    await Promise.all([...add].map((loc) => db.addFileLocation(loc)));
    // This shouldn't be needed, as db.add/remove should update the db as needed
    // await RescanAudioDatase();
    SendDatabase(db);
  } catch (e) {
    err(e);
  }
}

export function UpdateAudioLocations(newLocations: string): void {
  UpdateLocations(newLocations).catch(err);
}

function getCommonPrefix(
  db: AudioDatabase,
  songKeys: SongKey[],
): string | void {
  const paths: string[] = songKeys
    .map((sk) => {
      const song = db.getSong(sk);
      return song ? song.path : undefined;
    })
    .filter((s) => s !== undefined) as string[];
  let prefix = '';
  if (paths.length === 0) {
    return prefix;
  }

  for (let i = 0; i < paths[0].length; i++) {
    const char = paths[0][i]; // loop through all characters of the very first string.
    for (let j = 1; j < paths.length; j++) {
      // loop through all other strings in the array
      if (paths[j][i] !== char) {
        return prefix;
      }
    }
    prefix = prefix + char;
  }

  return prefix;
}

export async function GetPathFromKey(key?: MediaKey): Promise<string | void> {
  if (key) {
    const db = await GetAudioDB();
    if (isAlbumKey(key)) {
      const theAlbum = db.getAlbum(key);
      return theAlbum ? getCommonPrefix(db, theAlbum.songs) : undefined;
    } else if (isArtistKey(key)) {
      const theArtist = db.getArtist(key);
      return theArtist ? getCommonPrefix(db, theArtist.songs) : undefined;
    } else if (isSongKey(key)) {
      const theSong = db.getSong(key);
      return theSong ? theSong.path : undefined;
    }
  }
}

export async function GetMediaInfoForSong(
  key?: string,
): Promise<Map<string, string> | void> {
  if (!key || typeof key !== 'string') {
    return;
  }
  const db = await GetAudioDB();
  const song = db.getSong(key);
  if (song) {
    const data: Map<string, string> = await GetMediaInfo(song.path);
    log(`Fetched the media info for ${song.path}:`);
    log(data);
    return data;
  }
}

/**
 * @function setMediaInfoForSong
 * Responds to a request from the Render process with a flattened set of
 * partial metadata
 * @param  {string} flattenedData? - The (partial) metadata to be used to
 * override file name or internal metadata with
 * @returns Promise
 */
export async function SetMediaInfoForSong(
  metadataToUpdate: MinimumMetadata,
): Promise<void> {
  let fullPath: string = metadataToUpdate.originalPath;
  const db = await GetAudioDB();
  if (fullPath.startsWith('*')) {
    // This means we've got a SongKey instead of a path
    // Get the path from the database
    const sng = db.getSong(fullPath.substr(1));
    if (!sng) {
      err('Unable to get the song for the song key for a metadata update');
      return;
    }
    fullPath = sng.path;
    metadataToUpdate.originalPath = fullPath;
  }
  db.updateMetadata(fullPath, metadataToUpdate);
}

export async function SearchWholeWord(
  term?: string,
): Promise<SearchResults | void> {
  if (!term) {
    return;
  }
  const db = await GetAudioDB();
  return db.searchIndex(false, term);
}

export async function SearchSubstring(
  term?: string,
): Promise<SearchResults | void> {
  if (!term) {
    return;
  }
  const db = await GetAudioDB();
  return db.searchIndex(true, term);
}
