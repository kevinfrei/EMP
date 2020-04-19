// @flow
const { ipcMain, BrowserWindow } = require('electron');
const logger = require('simplelogger');
const { FTON } = require('my-utils');

const persist = require('./persist');

import type { FTONData } from 'my-utils';

const log = logger.bind('Communication');
//logger.enable('Communication');

// This returns an array of object handlers

export type MessageHandler<T> = {
  command: string,
  validator: (val: string) => ?T,
  handler: (data: T) => void,
};

export type KVP = {
  key: string,
  value: FTONData,
};

const kvpValidator = (val: string): ?KVP => {
  try {
    const res = FTON.parse(val);
    if (
      typeof res === 'object' &&
      res !== null &&
      res.hasOwnProperty('key') &&
      res.hasOwnProperty('value') &&
      typeof res.key === 'string'
    ) {
      return res;
    }
  } catch (e) {}
  return undefined;
};

const stringValidator = (val: string): ?string => val;

const setter = ({ key, value }: KVP) => {
  log(`Persisting '${key}' to:`);
  log(value);
  persist.setItem(key, FTON.stringify(value));
  // KBF: Continue here maybe?
  switch (key) {
    case 'locations':
      return;
  }
};

const deleter = (key: string) => {
  persist.deleteItem(key);
};

// Get a value from disk and sends {key:'key', value: ...value} in JSON
const getter = (key: string) => {
  try {
    const val = persist.getItem(key);
    if (typeof val !== 'string') {
      log(`getting ${key} results in non-string value:`);
      log(val);
      return;
    }
    // TODO: This needs updated if/when I add more windows...
    log(`About to send {key:${key}, value:${val}}`);
    const value = FTON.parse(val);
    const allWnd: Array<BrowserWindow> = BrowserWindow.getAllWindows();
    if (allWnd.length < 1) {
      log('No browser windows found in get operation.');
      return;
    }
    const webCont = allWnd[0].webContents;
    const message = FTON.stringify({ key, value });
    log(`Sending data: ${message}`);
    webCont.send('data', message);
  } catch (e) {
    log('Swallowed exception during get operation:');
    log(e);
  }
};

function mk<T>(
  command: string,
  validator: (val: string) => ?T,
  handler: (data: T) => void
): MessageHandler<T> {
  return { command, validator, handler };
}

const comms = [
  mk<KVP>('set', kvpValidator, setter),
  mk<string>('delete', stringValidator, deleter),
  mk<string>('get', stringValidator, getter),
];
let win = null;

function SendDatabase() {
  let musicDB = persist.getItem('DB');
  if (!win || !musicDB) {
    setTimeout(SendDatabase, 10);
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
}
// Called to just set stuff up (nothing has actually been done yet)
function Init() {
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
}

// Called with the window handle after it's been created
function Begin(window) {
  win = window;
  SendDatabase();
}

module.exports = { Init, Begin };
