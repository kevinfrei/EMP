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
  MakeAudioDatabase,
} from 'audio-database';
import electronIsDev from 'electron-is-dev';
import { asyncSend } from './Communication';
import { Persistence } from './persist';

// eslint-disable-next-line
const log = MakeLogger('AudioDatabase', true && electronIsDev);
// eslint-disable-next-line
const err = MakeError('AudioDatabase-err');

let theAudioDb: AudioDatabase | null;

export async function GetAudioDB(): Promise<AudioDatabase> {
  if (theAudioDb == null) {
    theAudioDb = await MakeAudioDatabase(Persistence);
  }
  return theAudioDb;
}

export async function getSimpleMusicDatabase(): Promise<FlatAudioDatabase> {
  const db = await GetAudioDB();
  return db.getFlatDatabase();
}

export async function RescanAudioDatase(): Promise<void> {
  const db = await GetAudioDB();
  log('Rescanning the DB');
  await db.refresh();
  log('Rescanning complete');
  const flat = db.getFlatDatabase();
  log(flat);
  asyncSend({ 'music-database-update': flat });
}

async function UpdateLocations(locs: string): Promise<void> {
  try {
    const locations = SafelyUnpickle(locs, Type.isArrayOfString);
    if (!locations) {
      return;
    }
    const db = await GetAudioDB();
    const existingLocations = db.getLocations();
    const add = Operations.SetDifference(new Set(locations), existingLocations);
    const remove = Operations.SetDifference(
      new Set(existingLocations),
      locations,
    );
    log('Adding:');
    log(add);
    log('removing:');
    log(remove);
    await Promise.all([...remove].map((loc) => db.removeFileLocation(loc)));
    await Promise.all([...add].map((loc) => db.addFileLocation(loc)));
    await RescanAudioDatase();
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
