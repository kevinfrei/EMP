// @flow

const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('simplelogger');

import type { Rectangle } from 'electron';

const log = logger.bind('persist');
logger.disable('persist');

export type WindowPosition = {|
  bounds: Rectangle,
  isMaximized: boolean
|};

export type Persist = {
  getItem(key: string): mixed,
  setItem(key: string, value: mixed): void,
  deleteItem(key: string): void,
  getWindowPos(): WindowPosition,
  setWindowPos(st: WindowPosition): void,
  getBrowserWindowPos(st: WindowPosition): Rectangle
};

const makeWindowPos = (
  x: number,
  y: number,
  width: number,
  height: number,
  isMaximized: boolean
) => ({ bounds: { x, y, width, height }, isMaximized });

const defaultWindowPosition: WindowPosition = makeWindowPos(
  Number.MIN_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
  900,
  680,
  false
);

// Here's a place for app settings & stuff...
const storageLocation: string = path.join(app.getPath('userData'), 'data.json');
log(`User data location: ${storageLocation}`);
const readFile = (): Object => {
  try {
    return JSON.parse(fs.readFileSync(storageLocation, 'utf8'));
  } catch (e) {
    return {};
  }
};
const writeFile = (val: Object): void => {
  fs.writeFileSync(storageLocation, JSON.stringify(val), 'utf8');
};
const persist: Persist = {
  getItem: (key: string): mixed => {
    log(`Reading ${key}`);
    const val: Object = readFile();
    return val[key];
  },
  setItem: (key: string, value: mixed): void => {
    log(`Writing ${key}:`);
    log(value);
    const val: Object = readFile();
    val[key] = value;
    writeFile(val);
  },
  deleteItem: (key: string): void => {
    log(`deleting ${key}`);
    const val: Object = readFile();
    delete val[key];
    writeFile(val);
  },
  getWindowPos: (): WindowPosition => {
    try {
      const tmpws: mixed = persist.getItem('windowPosition');
      if (tmpws && typeof tmpws === 'object' && tmpws.bounds) {
        const bounds = tmpws.bounds;
        if (
          typeof bounds === 'object' &&
          bounds.x !== undefined &&
          typeof bounds.x === 'number' &&
          bounds.y !== undefined &&
          typeof bounds.y === 'number' &&
          bounds.width !== undefined &&
          typeof bounds.width === 'number' &&
          bounds.height !== undefined &&
          typeof bounds.height === 'number' &&
          tmpws.isMaximized !== undefined &&
          tmpws.isMaximized !== null &&
          typeof tmpws.isMaximized === 'boolean'
        ) {
          return makeWindowPos(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            tmpws.isMaximized
          );
        }
      }
    } catch (err) {}
    return defaultWindowPosition;
  },
  setWindowPos: (st: WindowPosition): void => {
    persist.setItem('windowPosition', st);
  },
  getBrowserWindowPos: (st: WindowPosition): Rectangle => ({
    width: st.bounds.width,
    height: st.bounds.height,
    x: st.bounds.x == Number.MIN_SAFE_INTEGER ? undefined : st.bounds.x,
    y: st.bounds.y == Number.MIN_SAFE_INTEGER ? undefined : st.bounds.y
  })
};

module.exports = persist;
