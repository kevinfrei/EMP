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

const configureProtocols = () => {
  protocol.registerFileProtocol(
    'pic',
    (req, callback) => {
      log('pic URL request:');
      log(req);
      callback({ path: path.join(__dirname, 'img-album.svg') });
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
      const thePath =
        "/Volumes/Thunderbolt/Audio/Sorted/Accurate/Tool - 2019 - Fear Inoculum/High/09 - 7empest.flac";
      log('Returning path ' + thePath);
      callback({ path: thePath });
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