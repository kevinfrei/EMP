import {
  MakeError,
  MakeLogger,
  Pickle,
  UnsafelyUnpickle,
} from '@freik/core-utils';
import { Album, AlbumKey, Artist, ArtistKey, SongKey } from '@freik/media-core';
import { MusicDB, MusicIndex, ServerSong } from './OldMusicScanner';
import { Persistence } from './persist';

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
      const musicDBstr = await Persistence.getItemAsync('musicDatabase');
      if (musicDBstr) {
        log(`get-music-db: ${musicDBstr.length} bytes in the JSON blob.`);
        theMusicDatabase = UnsafelyUnpickle<MusicDB>(musicDBstr);
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
      await Persistence.setItemAsync('musicDatabase', Pickle(emptyDB));
      return;
    }
  } else {
    return theMusicDatabase;
  }
}

export async function saveMusicDB(musicDB: MusicDB): Promise<void> {
  theMusicDatabase = musicDB;
  log(`Saving DB with ${musicDB.songs.size} songs`);
  await Persistence.setItemAsync('musicDatabase', Pickle(theMusicDatabase));
}
