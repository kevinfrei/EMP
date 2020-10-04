import { FTON, FTONData, Logger } from '@freik/core-utils';
import { BrowserWindow } from 'electron';
import { getMusicDB } from './MusicAccess';
import * as music from './MusicScanner';
import * as persist from './persist';

const log = Logger.bind('Startup');
// Logger.enable('Startup');

function getLocations(): string[] {
  const strLocations = persist.getItem('locations');
  const rawLocations = strLocations ? FTON.parse(strLocations) : [];
  return (rawLocations && FTON.arrayOfStrings(rawLocations)) || [];
}

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
  /* TODO: persist the index
   (more TODO: load the index)
  await persist.setItemAsync(
    'index',
    ...);
    */
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
