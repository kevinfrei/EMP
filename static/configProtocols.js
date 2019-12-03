// @flow

const path = require('path');
const { protocol } = require('electron');
const logger = require('simplelogger');

/*
protocol.registerSchemesAsPrivileged([
  { scheme: 'pic', privileges: { standard: true, secure: true } },
  { scheme: 'tune', privileges: { standard: true, secure: true } }
]);
*/
//logger.disable('configProtocols');
const log = (...args: Array<mixed>) => logger('configProtocols', ...args);

const songs: string[] = [
  '09 - 7empest.flac',
  '02 - Pneuma.flac',
  '04 - Invincible.flac',
  '01 - Fear Inoculum.flac'
];

const configureProtocols = () => {
  protocol.registerFileProtocol('pic', (req, callback) => {
    log('pic URL request:');
    log(req);
    if (!req.url) {
      callback({ error: -324 });
    } else if (req.url.startsWith('pic://album/')) {
      callback({
        path:
          '/Volumes/Thunderbolt/Audio/Sorted/Accurate/Tool - 2019 - Fear Inoculum/High/Cover.png'
      });
    } else {
      callback({ path: path.join(__dirname, 'img-album.svg') });
    }
  });
  protocol.registerFileProtocol('tune', (req, callback) => {
    log('tune URL request:');
    log(req);
    if (!req.url) {
      callback({ error: -324 });
    } else if (req.url.startsWith('tune://song/')) {
      const val = req.url.charCodeAt(12) % songs.length;
      const thePath =
        '/Volumes/Thunderbolt/Audio/Sorted/Accurate/Tool - 2019 - Fear Inoculum/High/' +
        songs[val];
      log('Returning path ' + thePath);
      callback({ path: thePath });
    } else {
      callback({ error: 404 });
    }
  });
};

module.exports = configureProtocols;
