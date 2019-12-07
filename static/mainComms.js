// @flow
const logger = require('simplelogger');
const { BrowserWindow } = require('electron');

const persist = require('./persist');

const log = logger.bind('mainComms');
// logger.disable('mainComms');

// This returns an array of object handlers

export type MessageHandler<T> = {
  command: string,
  validator: (val: string) => ?T,
  handler: (data: T) => void
};

export type KVP = {
  key: string,
  value: mixed
};

const kvpValidator = (val: string): ?KVP => {
  try {
    const res = JSON.parse(val);
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
  persist.setItem(key, JSON.stringify(value));
};

const deleter = (key: string) => {
  persist.deleteItem(key);
};

const getter = (key: string) => {
  const val = persist.getItem(key);
  BrowserWindow.getFocusedWindow().webContents.send('data', val);
};

const mk = <T>(
  command: string,
  validator: (val: string) => ?T,
  handler: (data: T) => void
): MessageHandler<T> => ({ command, validator, handler });

module.exports = [
  mk<KVP>('set', kvpValidator, setter),
  mk<string>('delete', stringValidator, deleter),
  mk<string>('get', stringValidator, getter)
];
