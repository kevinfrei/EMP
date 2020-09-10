import { app, BrowserWindow } from 'electron';
import { Logger, FTON } from '@freik/core-utils';

import * as persist from './persist';
import * as music from './MusicScanner';
import { SendDatabase, SetIndex } from './Communication';
import makeIndex from './search';

import type { FTONData } from '@freik/core-utils';

const log = Logger.bind('Startup');
Logger.enable('Startup');

function getLocations(): string[] {
  const rawLocations = persist.getItem<FTONData>('locations');
  return (
    (rawLocations && FTON.arrayOfStrings(rawLocations)) || [
      app.getPath('music'),
    ]
  );
}

async function getMusicDb() {
  const musicLocations = getLocations();
  log('Got music locations:');
  log(musicLocations);
  const musicDB = await music.find(musicLocations);
  log('Got Music DB!');
  persist.setItem('DB', musicDB);
  const artistIndex = makeIndex(musicDB.artists.values(), (a) => a.name);
  SetIndex('artist', artistIndex);
}

function UpdateAndSendDB() {
  getMusicDb()
    .then(SendDatabase)
    .catch((rej) => {
      log('Caught an exception while trying to update the db');
      log(rej);
    });
}

// This is awaited upon initial window creation
export async function Startup(): Promise<void> {
  // Scan for all music
  log('Trying to get DB');
  const musicDB = await persist.getItemAsync<music.MusicDB>('DB');
  // If we already have a musicDB, continue and schedule it to be rescanned
  if (musicDB) {
    log('Got the DB');
    setTimeout(UpdateAndSendDB, 1);
  } else {
    log('No DB available');
    // If we don't already have it, wait to start until we've read it.
    await getMusicDb();
  }
}

export function Ready(window: BrowserWindow): void {
  // Do anything here that needs to happen once we have the window
  // object available
  persist.subscribe('locations', UpdateAndSendDB);
}
