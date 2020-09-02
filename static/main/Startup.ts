import { app, ipcMain } from 'electron';
import { logger } from '@freik/simplelogger';
import { FTON } from '@freik/core-utils';

import * as persist from './persist';
import * as music from './music';
import { SendDatabase, SetIndex } from './Communication';
import makeIndex from './search';

import type { MusicDB } from './music';

const log = logger.bind('Startup');

function getLocations(): Array<string> {
  let rawLocations = persist.getItem('locations');
  let musicLocations = rawLocations
    ? FTON.arrayOfStrings(rawLocations)
    : undefined;
  if (!musicLocations || musicLocations.length === 0) {
    // Default the music locations to the OS-specific "music" path
    musicLocations = [app.getPath('music')];
    persist.setItem('locations', musicLocations);
  }
  return musicLocations;
}

async function getMusicDb() {
  let musicLocations = getLocations();
  log('Got music locations:');
  log(musicLocations);
  let musicDB = await music.find(musicLocations);
  log('Got Music DB!');
  persist.setItem('DB', musicDB);
  const artistIndex = makeIndex(musicDB.artists.values(), (a) => a.name);
  SetIndex('artist', artistIndex);
}

function UpdateAndSendDB() {
  getMusicDb()
    .then(SendDatabase)
    .catch((rej) => {
      console.log('Caught an exception while trying to update the db');
      console.log(rej);
    });
}

// This is awaited upon initial window creation
export async function Startup() {
  // Scan for all music
  let musicDB = persist.getItem('DB');
  // If we already have a musicDB, continue and schedule it to be rescanned
  if (musicDB) {
    setTimeout(UpdateAndSendDB, 1);
  } else {
    // If we don't already have it, wait to start until we've read it.
    await getMusicDb();
  }
}

export function Ready(window) {
  // Do anything else here that needs to happen once we have the window
  // object available
  persist.subscribe('locations', UpdateAndSendDB);
}
