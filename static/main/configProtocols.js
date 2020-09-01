// @flow

const path = require('path');
const { protocol } = require('electron');
const { logger } = require('@freik/simplelogger');

const persist = require('./persist');

import type { MusicDB } from './music';
/*
protocol.registerSchemesAsPrivileged([
  { scheme: 'pic', privileges: { standard: true, secure: true } },
  { scheme: 'tune', privileges: { standard: true, secure: true } }
]);
*/
const log = logger.bind('configProtocols');
//logger.enable('configProtocols');

const configureProtocols = () => {
  protocol.registerFileProtocol('pic', (req, callback) => {
    log('pic URL request:');
    log(req);
    if (!req.url) {
      log('No URL specified in pic request');
      callback({ error: -324 });
    } else if (req.url.startsWith('pic://album/')) {
      // Let's check the db to see if we've got
      const db: MusicDB = persist.getItem('DB');
      const maybePath = db.pictures.get(req.url.substr(12));
      if (maybePath) {
        callback({ path: maybePath });
      } else {
        const thePath = path.join(__dirname, '..', 'img-album.svg');
        log(`Album cover pic:// Returning ${thePath}`);
        callback({ path: thePath });
      }
    } else {
      const thePath = path.join(__dirname, '..', 'img-album.svg');
      log(`Non-album cover pic:// Returning ${thePath}`);
      callback({ path: thePath });
    }
  });
  protocol.registerFileProtocol('tune', (req, callback) => {
    log('tune URL request:');
    log(req);
    if (!req.url) {
      callback({ error: -324 });
    } else if (req.url.startsWith('tune://song/')) {
      const key = req.url.substring(12);
      const db: MusicDB = persist.getItem('DB');
      const song = db.songs.get(key);
      if (song) {
        const thePath = song.path;
        log('Returning path ' + thePath);
        callback({ path: thePath });
      }
    } else {
      callback({ error: 404 });
    }
  });
};

module.exports = configureProtocols;
