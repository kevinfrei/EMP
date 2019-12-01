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

const songs = [
  '09 - 7empest.flac',
  '02 - Pneuma.flac',
  '04 - Invincible.flac',
  '01 - Fear Inoculum.flac'
];

const configureProtocols = () => {
  protocol.registerFileProtocol(
    'pic',
    (req, callback) => {
      log('pic URL request:');
      log(req);
      if (req.url.startsWith('pic://album/')) {
        callback({
          path:
            '/Volumes/Thunderbolt/Audio/Sorted/Accurate/Tool - 2019 - Fear Inoculum/High/Cover.png'
        });
      } else {
        callback({ path: path.join(__dirname, 'img-album.svg') });
      }
    },
    error => {
      if (error) {
        log('failed to register "pic" protocol:');
        log(error);
      } else {
        log('pic reg: did something, I guess');
      }
    }
  );
  protocol.registerFileProtocol(
    'tune',
    (req, callback) => {
      log('tune URL request:');
      log(req);
      // req.url: "tune://song/song.flac"
      if (req.url.startsWith('tune://song/')) {
        const val = req.url.charCodeAt(12) % songs.length;
        const thePath =
          '/Volumes/Thunderbolt/Audio/Sorted/Accurate/Tool - 2019 - Fear Inoculum/High/' +
          songs[val];
        log('Returning path ' + thePath);
        callback({ path: thePath });
      } else {
        // Do something?
      }
    },
    error => {
      if (error) {
        log('failed to register "tune" protocol:');
        log(error);
      } else {
        log('tune reg: did something I guess');
      }
    }
  );
};

module.exports = configureProtocols;
