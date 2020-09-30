import { Logger } from '@freik/core-utils';
import { protocol, ProtocolRequest, ProtocolResponse } from 'electron';
import path from 'path';
import { getMusicDB } from './MusicAccess';
import * as persist from './persist';
import { CreateMusicDB } from './Startup';

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
    log('Locations updated: About to re-scan music');
    // If locations changed, update the music database

    /*
     * TODO: Even though the selectors in the render process all depend upon
     * locations, this update doesn't register before the render process has
     * already grabbed the previous music DB. There needs to be some sort of
     * Locations-based hash to ensure that a request isn't fulfilled until the
     * rest of the data has been received
     */

    CreateMusicDB()
      .then(() => log('DB Updated!'))
      .catch((r) => log('DB Update failed'));
  });
}
