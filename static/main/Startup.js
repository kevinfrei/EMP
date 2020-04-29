// @flow

const { app, ipcMain } = require('electron');
const logger = require('simplelogger');
const { FTON } = require('my-utils');

const persist = require('./persist');
const music = require('./music');
const { SendDatabase } = require('./Communication');

import type { MusicDB } from './music';

const log = logger.bind('Startup');

function getLocations(): Array<string> {
  let musicLocations = FTON.arrayOfStrings(
    FTON.parse(persist.getItem('locations'))
  );
  if (!musicLocations || musicLocations.length === 0) {
    // Default the music locations to the OS-specific "music" path
    musicLocations = [app.getPath('music')];
    persist.setItem('locations', musicLocations);
  }
  return musicLocations;
}

async function getMusicDb() {
  let musicLocations = getLocations();
  let musicDB = await music.find(musicLocations);
  persist.setItem('DB', musicDB);
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
async function Startup() {
  // Scan for all music
  let musicDB = persist.getItem('DB');
  // If we already have a musicDB, continue and schedule it to be rescanned
  if (musicDB) {
    setTimeout(UpdateAndSendDB, 250);
  } else {
    // If we don't already have it, wait to start until we've read it.
    await getMusicDb();
  }
}

function Ready(window) {
  // Do anything else here that needs to happen once we have the window
  // object available
  persist.subscribe('locations', UpdateAndSendDB);
}

module.exports = { Startup, Ready };
