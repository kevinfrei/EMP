// @flow
const logger = require('simplelogger');
const { BrowserWindow } = require('electron');
const { FTON } = require('my-utils');

const persist = require('./persist');

import type { FTONData } from 'my-utils';

const log = logger.bind('mainComms');
logger.enable('mainComms');

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

const mk = <T>(
  command: string,
  validator: (val: string) => ?T,
  handler: (data: T) => void
): MessageHandler<T> => ({ command, validator, handler });

module.exports = [
  mk<KVP>('set', kvpValidator, setter),
  mk<string>('delete', stringValidator, deleter),
  mk<string>('get', stringValidator, getter),
];
