// @flow

const { app, ipcMain } = require('electron');
const path = require('path');
const logger = require('simplelogger');

const persist = require('./persist');
const setup = require('./electronSetup');
const comms = require('./mainComms');
const music = require('./music');

import type { BrowserWindow } from 'electron';
import type { OnWindowCreated } from './electronSetup';
import type { MusicDB } from './music';
import type { MessageHandler } from './mainComms';

const log = logger.bind('electron');
logger.disable('electron');

let musicDB: ?MusicDB;

const init = async () => {
  // Check to see if we have any locations to start with
  // If not, start with the "music" location and see what we can find...
  musicDB = persist.getItem('DB');
  if (!musicDB) {
    let musicLocations = JSON.parse(persist.getItem('locations'));
    if (!musicLocations) {
      musicLocations = [app.getPath('music')];
      persist.setItem('locations', JSON.stringify(musicLocations));
    }
    log('Looking for music: ');
    log(musicLocations);
    log('...');
    musicDB = await music.find(musicLocations);

    // I wonder how big this winds up being :/
    log('Finished finding music');
    persist.setItem('DB', musicDB);
  } else {
    // TODO: Rescan source locations
  }
};
let val = 0;
const onWindowCreated: OnWindowCreated = (window: BrowserWindow): void => {
  // Initialize stuff now
  init()
    .then(() => {
     // TODO: Update the music in the renderer
    })
    .catch(e => {
      console.error(e);
      window.webContents.send('data', '{"error":"loading"}');
    });
};

// The only messages I expect from the render are these 3:
// 'set', 'delete', 'get'
// 'set': JSON of this: {key: 'name', value: stuff}
// 'delete': 'name'
// 'get': 'name'

comms.forEach(<T>(val: MessageHandler<T>) => {
  ipcMain.on(val.command, (event, arg) => {
    log(`checking ${val.command}`);
    const data: ?T = val.validator(arg);
    if (data !== undefined && data !== null) {
      log(`Got data for ${val.command}:`);
      log(`typeof data: ${typeof data}`);
      log(data);
      val.handler(data);
    } else {
      log('data validation failure');
      log(arg);
    }
  });
});

// messages to send to the client:
// 'data', JSON of data sending

setup(onWindowCreated);
