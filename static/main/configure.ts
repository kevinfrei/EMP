import path from 'path';
import { protocol } from 'electron';
import { Logger } from '@freik/core-utils';

import * as persist from './persist';

import type { ProtocolRequest, ProtocolResponse } from 'electron';
import { getMusicDB } from './MusicAccess';

declare type HandlerCallback = (response: string | ProtocolResponse) => void;

const log = Logger.bind('configure');
// Logger.enable('configure');

function picProtocol(req: ProtocolRequest, callback: HandlerCallback) {
  log('pic URL request:');
  log(req);
  if (!req.url) {
    log('No URL specified in pic request');
    return callback({ error: -324 });
  }
  const defaultValue = () => {
    const thePath = path.join(__dirname, '..', 'img-album.svg');
    log(`Non-album cover pic:// Returning ${thePath}`);
    callback({ path: thePath });
  };
  if (req.url.startsWith('pic://album/')) {
    // Let's check the db to see if we've got
    log('Trying to get the DB');
    getMusicDB()
      .then((db) => {
        if (db) {
          const maybePath = db.pictures.get(req.url.substr(12));
          if (maybePath) {
            callback({ path: maybePath });
          }
        }
        defaultValue();
      })
      .catch(defaultValue);
  }
  defaultValue();
}

function tuneProtocol(req: ProtocolRequest, callback: HandlerCallback) {
  log('tune URL request:');
  log(req);
  if (!req.url) {
    callback({ error: -324 });
  } else if (req.url.startsWith('tune://song/')) {
    const key = req.url.substring(12);
    getMusicDB()
      .then((db) => {
        if (!db) {
          callback({ error: 404 });
        } else {
          const song = db.songs.get(key);
          if (song) {
            const thePath = song.path;
            log('Returning path ' + thePath);
            callback({ path: thePath });
          }
        }
      })
      .catch((e) => callback({ error: 404 }));
  } else {
    callback({ error: 404 });
  }
}

// This sets up all protocol handlers
export function configureProtocols(): void {
  protocol.registerFileProtocol('pic', picProtocol);
  protocol.registerFileProtocol('tune', tuneProtocol);
}

// This sets up reactive responses to changes, for example:
// locations change, so music needs to be rescanned
export function configureListeners(): void {
  persist.subscribe('locations', (newLocationsValue) => {
    // If locations changed, update the music database
    // TODO: Update the music database here
  });
}
