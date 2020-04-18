// @flow

const { app, ipcMain } = require('electron');
const path = require('path');
const logger = require('simplelogger');
const { FTON } = require('my-utils');

const persist = require('./main/persist');
const setup = require('./main/electronSetup');
const comms = require('./main/mainComms');
const music = require('./main/music');

import type { BrowserWindow } from 'electron';
import type { OnWindowCreated } from './main/electronSetup';
import type { MusicDB } from './main/music';
import type { MessageHandler } from './main/mainComms';

const log = logger.bind('electron');
//logger.enable('electron');

let musicDB: ?MusicDB;

const getLocations = (): Array<string> => {
  let musicLocations = FTON.parse(persist.getItem('locations'));
  if (!musicLocations || !Array.isArray(musicLocations)) {
    musicLocations = [app.getPath('music')];
    persist.setItem('locations', FTON.stringify(musicLocations));
  }
  return musicLocations;
};

const init = async () => {
  // Check to see if we have any locations to start with
  // If not, start with the "music" location and see what we can find...
  musicDB = persist.getItem('DB');
  let musicLocations = getLocations();
  if (!musicDB) {
    log('Looking for music: ');
    log(musicLocations);
    log('...');
    musicDB = await music.find(musicLocations);

    // I wonder how big this winds up being :/
    log('Finished finding music');
    persist.setItem('DB', musicDB);
  } else {
    log('re-looking for music: ');
    log(musicLocations);
    musicDB = await music.find(musicLocations);
    log('Done re-scanning music');
    persist.setItem('DB', musicDB);
  }
};

let win = null;

const SendDatabase = () => {
  if (win === null) {
    setTimeout(SendDatabase, 50);
    return;
  }
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Albums', value: musicDB.albums })
  );
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Songs', value: musicDB.songs })
  );
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Artists', value: musicDB.artists })
  );
};

const onWindowCreated: OnWindowCreated = (window: BrowserWindow): void => {
  // Initialize stuff now
  init()
    .then(() => {
      win = window;
    })
    .catch((e) => {
      console.error(e);
      window.webContents.send('data', '{"error":"loading"}');
    });
};

// The primary messages I expect from the render are these 3:
// 'set', 'delete', 'get'

// 'set': JSON of this: {key: 'name', value: stuff}
// 'delete': 'name'
// 'get': 'name'

// In addition, there's the 'GetDatabase' request
comms.forEach(<T>(val: MessageHandler<T>) => {
  ipcMain.on(val.command, (event, arg: string) => {
    const data: ?T = val.validator(arg);
    if (data !== undefined && data !== null) {
      log(`Got data for "${val.command}":`);
      log(data);
      val.handler(data);
    } else {
      log(`data validation failure while checking ${val.command}`);
      log(arg);
    }
  });
});

ipcMain.on('GetDatabase', SendDatabase);

// messages to send to the client:
// 'data', JSON of data sending

setup(onWindowCreated);
