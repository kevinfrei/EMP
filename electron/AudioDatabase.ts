import {
  AudioDatabase,
  FlatAudioDatabase,
  GetMediaInfo,
  MakeAudioDatabase,
  MinimumMetadata,
  SearchResults,
} from '@freik/audiodb';
import { Persistence } from '@freik/elect-main-utils';
import { SetDifference } from '@freik/helpers';
import { MakeLog } from '@freik/logger';
import {
  MediaKey,
  SongKey,
  isAlbumKey,
  isArtistKey,
  isSongKey,
} from '@freik/media-core';
import { Sleep } from '@freik/sync';
import { Pickle, SafelyUnpickle, isArrayOfString } from '@freik/typechk';
import { statSync } from 'fs';
import path from 'path';
import { IgnoreItem, IpcId, isIgnoreItemArrayFn } from 'shared';
import { SendToUI } from './Communication';

const { log, wrn } = MakeLog('EMP:main:AudioDatabase');

let theAudioDb: AudioDatabase | null;
let initialUpdateComplete = false;

function fileWatchFilter(filepath: string): boolean {
  try {
    const stat = statSync(filepath);
    if (stat.isDirectory()) {
      try {
        const noXcode = path.join(filepath, '.notranscode');
        const st = statSync(noXcode);
        return !st.isFile();
      } catch (errorValue) {
        /* */
      }
    }
  } catch (e) {
    /* */
  }
  return true;
}

export async function GetAudioDB(): Promise<AudioDatabase> {
  if (theAudioDb == null) {
    theAudioDb = await MakeAudioDatabase(Persistence, {
      fileWatchFilter,
      watchHidden: false,
    });
    if (theAudioDb === null) {
      throw new Error(
        'This be very bad, folks: Try uninstalling and reinstalling :/',
      );
    }
    const igListString = await Persistence.getItemAsync(IpcId.IgnoreListId);
    const igList = SafelyUnpickle(igListString || '[]', isIgnoreItemArrayFn);
    igList?.forEach(({ type, value }) =>
      theAudioDb!.addIgnoreItem(type, value),
    );
  }
  return theAudioDb;
}

export async function GetSimpleMusicDatabase(): Promise<FlatAudioDatabase> {
  while (!initialUpdateComplete) {
    await Sleep(50);
  }
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
  SendToUI(IpcId.MusicDBUpdate, flat);
}

export async function RescanAudioDatase(): Promise<void> {
  try {
    SendToUI(IpcId.RescanInProgress, true);
    const db = await GetAudioDB();
    log('Rescanning the DB');
    await db.refresh();
    log('Rescanning complete');
    SendDatabase(db);
  } finally {
    SendToUI(IpcId.RescanInProgress, false);
  }
}

export async function UpdateLocations(locs: string): Promise<void> {
  try {
    const locations = SafelyUnpickle(locs, isArrayOfString);
    if (!locations) {
      return;
    }
    const db = await GetAudioDB();
    const existingLocations = db.getLocations();
    const add = SetDifference(new Set(locations), existingLocations);
    const del = SetDifference(new Set(existingLocations), locations);
    log('Adding:');
    log(add);
    log('removing:');
    log(del);
    await Promise.all([...del].map((loc) => db.removeFileLocation(loc)));
    await Promise.all([...add].map((loc) => db.addFileLocation(loc)));
    // This shouldn't be needed, as db.add/remove should update the db as needed
    // await RescanAudioDatase();

    // This isn't necessary. The UI will request the DB, and we wait until the db is complete
    // UpdateAudioLocations handles this change explicitly
    // SendDatabase(db);
  } catch (e) {
    wrn(e);
  } finally {
    initialUpdateComplete = true;
  }
}

export function UpdateAudioLocations(newLocations: string): void {
  UpdateLocations(newLocations)
    .catch(wrn)
    .then(GetAudioDB)
    .then((db) => SendDatabase(db))
    .catch(wrn);
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
      wrn('Unable to get the song for the song key for a metadata update');
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

export async function GetIgnoreList(): Promise<IgnoreItem[]> {
  const ignoreListString = await Persistence.getItemAsync(IpcId.IgnoreListId);
  if (!ignoreListString) {
    return [];
  }
  return SafelyUnpickle(ignoreListString, isIgnoreItemArrayFn) || [];
}

export async function AddIgnoreItem(item: IgnoreItem): Promise<void> {
  const igList = await GetIgnoreList();
  igList.push(item);
  const db = await GetAudioDB();
  db.addIgnoreItem(item.type, item.value);
  SendUpdatedIgnoreList(igList);
  await Persistence.setItemAsync(IpcId.IgnoreListId, Pickle(igList));
}

export async function RemoveIgnoreItem(item: IgnoreItem): Promise<void> {
  let igList = await GetIgnoreList();
  const db = await GetAudioDB();
  if (db.removeIgnoreItem(item.type, item.value)) {
    igList = [
      ...igList.filter(
        (val) => val.type !== item.type || val.value !== item.value,
      ),
    ];
    SendUpdatedIgnoreList(igList);
    await Persistence.setItemAsync(IpcId.IgnoreListId, Pickle(igList));
  }
}

export function SendUpdatedIgnoreList(list: IgnoreItem[]): void {
  SendToUI(IpcId.PushIgnoreList, list);
}
