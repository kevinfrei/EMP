// @flow

const { app } = require('electron');
const { JSONStorage } = require('node-localstorage');

import type { Rectangle } from 'electron';

export type WindowPosition = {|
  bounds: Rectangle,
  isMaximized: boolean
|};
export type Persist = {
  getItem(key: string): any,
  setItem(key: string, value: any): void,
  getWindowPos: () => WindowPosition,
  setWindowPos: (st: WindowPosition) => void,
  getBrowserWindowPos: (st: WindowPosition) => Rectangle
};

const defaultWindowPosition: WindowPosition = {
  bounds: {
    x: Number.MIN_SAFE_INTEGER,
    y: Number.MIN_SAFE_INTEGER,
    width: 900,
    height: 680
  },
  isMaximized: false
};

// Here's a place for app settings & stuff...
const storageLocation: string = app.getPath('userData');
const persist: Persist = new JSONStorage(storageLocation);
persist.getWindowPos = (): WindowPosition => {
  try {
    const tmpws: any = persist.getItem('windowPosition');
    if (
      tmpws !== undefined &&
      typeof tmpws === 'object' &&
      tmpws.bounds !== undefined &&
      typeof tmpws.bounds === 'object' &&
      tmpws.bounds.x !== undefined &&
      typeof tmpws.bounds.x === 'number' &&
      tmpws.bounds.y !== undefined &&
      typeof tmpws.bounds.y === 'number' &&
      tmpws.bounds.width !== undefined &&
      typeof tmpws.bounds.width === 'number' &&
      tmpws.bounds.height !== undefined &&
      typeof tmpws.bounds.height === 'number' &&
      tmpws.isMaximized !== undefined &&
      typeof tmpws.isMaximized === 'boolean'
    ) {
      return tmpws;
    }
  } catch (err) {}
  return defaultWindowPosition;
};
persist.setWindowPos = (st: WindowPosition) =>
  persist.setItem('windowPosition', st);
persist.getBrowserWindowPos = (st: WindowPosition): Rectangle => ({
  width: st.bounds.width,
  height: st.bounds.height,
  x: st.bounds.x == Number.MIN_SAFE_INTEGER ? undefined : st.bounds.x,
  y: st.bounds.y == Number.MIN_SAFE_INTEGER ? undefined : st.bounds.y
});

module.exports = persist;
