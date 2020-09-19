import { BrowserWindow } from 'electron';
import { Logger, FTON } from '@freik/core-utils';

import * as persist from './persist';
import * as music from './MusicScanner';
import { getMusicDB } from './MusicAccess';

const log = Logger.bind('Startup');
Logger.enable('Startup');

function getLocations(): string[] {
  const strLocations = persist.getItem('locations');
  const rawLocations = strLocations ? FTON.parse(strLocations) : [];
  return (rawLocations && FTON.arrayOfStrings(rawLocations)) || [];
}

async function createMusicDb() {
  const musicLocations = getLocations();
  log('Got music locations:');
  log(musicLocations);
  const musicDB = await music.find(musicLocations);
  log('Got Music DB!');
  await persist.setItemAsync('DB', FTON.stringify(musicDB));
}

function UpdateDb() {
  createMusicDb().catch((rej) => {
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
    setTimeout(UpdateDb, 1);
  } else {
    log('No DB available');
  }
}

export function Ready(window: BrowserWindow): void {
  // Do anything here that needs to happen once we have the window
  // object available
  persist.subscribe('locations', UpdateDb);
}
