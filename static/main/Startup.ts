import { FTON, FTONData, Logger } from '@freik/core-utils';
import { AlbumKey, ArtistKey, SongKey } from '@freik/media-utils';
import { BrowserWindow } from 'electron';
import { getMusicDB } from './MusicAccess';
import * as music from './MusicScanner';
import * as persist from './persist';
import { MakeSearchable, Searchable } from './Search';

const log = Logger.bind('Startup');
Logger.enable('Startup');

function getLocations(): string[] {
  const strLocations = persist.getItem('locations');
  const rawLocations = strLocations ? FTON.parse(strLocations) : [];
  return (rawLocations && FTON.arrayOfStrings(rawLocations)) || [];
}

let index:
  | {
      songs: Searchable<SongKey>;
      albums: Searchable<AlbumKey>;
      artists: Searchable<ArtistKey>;
    }
  | undefined;

export async function CreateMusicDB(): Promise<void> {
  const musicLocations = getLocations();
  log('Got music locations:');
  log(musicLocations);
  const musicDB = await music.find(musicLocations);
  log('Got Music DB!');
  await persist.setItemAsync(
    'DB',
    FTON.stringify((musicDB as unknown) as FTONData),
  );

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
  index = { songs, artists, albums };
  const stop = new Date().getTime();

  log(`Total time to build index: ${stop - start} ms`);
}

function UpdateDB() {
  CreateMusicDB().catch((rej) => {
    log('Caught an exception while trying to update the db');
    log(rej);
  });
}

// This is awaited upon initial window creation
export async function Startup(): Promise<void> {
  // Scan for all music
  log('Trying to get DB');
  const musicDB = await getMusicDB();
  // If we already have a musicDB, continue and schedule it to be rescanned
  if (musicDB) {
    log('Got the DB');
    setTimeout(UpdateDB, 1);
  } else {
    log('No DB available');
  }
}

export function Ready(window: BrowserWindow): void {
  // Do anything here that needs to happen once we have the window
  // object available
  persist.subscribe('locations', UpdateDB);
}
