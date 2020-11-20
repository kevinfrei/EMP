import { FTON, MakeError, MakeLogger } from '@freik/core-utils';
import { AlbumKey, ArtistKey, SongKey } from '@freik/media-utils';
import { asyncSend } from './Communication';
import { getMusicDB, saveMusicDB, setMusicIndex } from './MusicAccess';
import * as music from './MusicScanner';
import * as persist from './persist';
import { MakeSearchable } from './Search';

const log = MakeLogger('musicDB', true);
const err = MakeError('musicDB-err');

function getLocations(): string[] {
  const strLocations = persist.getItem('locations');
  const rawLocations = strLocations ? FTON.parse(strLocations) : [];
  log('getLocations:');
  log(rawLocations);
  return (rawLocations && FTON.arrayOfStrings(rawLocations)) || [];
}

async function CreateMusicDB(): Promise<void> {
  const musicLocations = getLocations();
  log('Got music locations:');
  log(musicLocations);
  const musicDB = await music.find(musicLocations);
  log('Got Music DB with songs count:');
  log(musicDB.songs.size);
  await saveMusicDB(musicDB);

  const start = new Date().getTime();
  const songs = MakeSearchable<SongKey>(
    musicDB.songs.keys(),
    (key: SongKey) => musicDB.songs.get(key)?.title || '',
  );
  const albums = MakeSearchable<AlbumKey>(
    musicDB.albums.keys(),
    (key: AlbumKey) => musicDB.albums.get(key)?.title || '',
  );
  const artists = MakeSearchable<ArtistKey>(
    musicDB.artists.keys(),
    (key: ArtistKey) => musicDB.artists.get(key)?.name || '',
  );
  setMusicIndex({ songs, artists, albums });
  const stop = new Date().getTime();

  log(`Total time to build index: ${stop - start} ms`);
}

export async function RescanDB(): Promise<void> {
  const prevDB = await getMusicDB();
  if (prevDB) {
    log('Songs before:' + prevDB.songs.size.toString());
  }
  await CreateMusicDB();
  const db = await getMusicDB();
  if (db) {
    log('About to send the update');
    asyncSend({ musicDatabase: db });
    if (prevDB) {
      log('Songs before:' + prevDB.songs.size.toString());
      log('Songs after: ' + db.songs.size.toString());
    }
  }
}

export function UpdateDB(): void {
  RescanDB()
    .then(() => log('Finished updating the database'))
    .catch((rej) => {
      err('Caught an exception while trying to update the db');
      err(rej);
    });
}
