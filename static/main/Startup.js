// @flow

const { app, ipcMain } = require('electron');
const logger = require('simplelogger');
const { FTON } = require('my-utils');

const persist = require('./persist');
const music = require('./music');

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

// This is awaited upon initial window creation
async function Startup() {
  // Scan for all music
  let musicLocations = getLocations();
  let musicDB = await music.find(musicLocations);
  log('Finished finding music');
  persist.setItem('DB', musicDB);
}

function Ready(window) {
  // Do anything else here that needs to happen once we have the window
  // object available
}

module.exports = { Startup, Ready };
