// @flow

import { app } from 'electron';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { logger } from '@freik/simplelogger';
import { FTON, SeqNum } from '@freik/core-utils';

import type { Rectangle } from 'electron';
import type { FTONData } from '@freik/core-utils';

const log = logger.bind('persist');
//logger.enable('persist');

export type MaybeRectangle = {
  width: number;
  height: number;
  x?: number;
  y?: number;
};

export type WindowPosition = {
  bounds: MaybeRectangle;
  isMaximized: boolean;
};

export type ValueUpdateListener = (val: FTONData) => void;

export type Persist = {
  getItem: <T>(key: string) => T | void;
  getItemAsync: <T>(key: string) => Promise<T | void>;
  setItem(key: string, value: FTONData): void;
  setItemAsync(key: string, value: FTONData): Promise<void>;
  deleteItem(key: string): void;
  deleteItemAsync(key: string): Promise<void>;
  getWindowPos(): WindowPosition;
  setWindowPos(st: WindowPosition): void;
  getBrowserWindowPos(st: WindowPosition): Rectangle;
  subscribe(key: string, listener: ValueUpdateListener): string;
  unsubscribe(id: string): boolean;
};

const memoryCache: Map<string, FTONData> = new Map();
const listeners: Map<string, Map<string, ValueUpdateListener>> = new Map();
const getNextListenerId = SeqNum();

// Here's a place for app settings & stuff...
function storageLocation(id: string): string {
  return path.join(app.getPath('userData'), `persist-${id}.json`);
}

log(`User data location: ${storageLocation('test')}`);

function readFile(id: string): FTONData {
  let data = memoryCache.get(id);
  if (data) {
    return data;
  }
  try {
    data = FTON.parse(fs.readFileSync(storageLocation(id), 'utf8'));
    memoryCache.set(id, data);
    return data;
  } catch (e) {}
  return {};
}

async function readFileAsync(id: string): Promise<FTONData> {
  let data = memoryCache.get(id);
  if (data) {
    return data;
  }
  try {
    const contents = await fsp.readFile(storageLocation(id), 'utf8');
    data = FTON.parse(contents);
    return data;
  } catch (e) {}
  return {};
}

function writeFile(id: string, val: FTONData): void {
  fs.writeFileSync(storageLocation(id), FTON.stringify(val), 'utf8');
  memoryCache.set(id, val);
}

async function writeFileAsync(id: string, val: FTONData): Promise<void> {
  await fsp.writeFile(storageLocation(id), FTON.stringify(val), 'utf8');
  memoryCache.set(id, val);
}

function deleteFile(id: string) {
  try {
    fs.unlinkSync(storageLocation(id));
    memoryCache.delete(id);
  } catch (e) {}
}

async function deleteFileAsync(id: string) {
  try {
    await fsp.unlink(storageLocation(id));
    memoryCache.delete(id);
  } catch (e) {}
}

function notify(key: string, val: FTONData) {
  // For each listener, invoke the listening function
  const ls = listeners.get(key);
  if (!ls) return;
  for (const [, fn] of ls) {
    fn(val);
  }
}

// Add a function to run when a value is persisted
export function subscribe(key: string, listener: ValueUpdateListener): string {
  const id = getNextListenerId();
  let keyListeners = listeners.get(key);
  if (!keyListeners) {
    keyListeners = new Map();
    listeners.set(key, keyListeners);
  }
  keyListeners.set(id, listener);
  return `${id}-${key}`;
}

// Remove the listening function with the given id
export function unsubscribe(id: string): boolean {
  const splitPt = id.indexOf('-');
  const actualId = id.substr(0, splitPt);
  const keyName = id.substr(splitPt + 1);
  const keyListeners = listeners.get(keyName);
  if (!keyListeners) {
    return false;
  }
  return keyListeners.delete(actualId);
}

// Get a value from disk/memory
export function getItem<T>(key: string): T | void {
  log('Reading ' + key);
  const val: any = readFile(key);
  if (val && typeof val === 'object' && key in val) {
    log('returning this value:');
    log(val[key]);
    return val[key] as T;
  } else {
    log('Failed to return value');
  }
}

// Get a value from disk/memory
export async function getItemAsync<T>(key: string): Promise<T | void> {
  log('Reading ' + key);
  const val: any = await readFileAsync(key);
  if (val && typeof val === 'object' && val.hasOwnProperty(key)) {
    log('returning this value:');
    log(val[key]);
    return val[key] as T;
  } else {
    log('Failed to return value');
  }
}

// Save a value to disk and cache it
export function setItem(key: string, value: FTONData): void {
  log(`Writing ${key}:`);
  log(value);
  const val: { [key: string]: FTONData } = {};
  val[key] = value;
  writeFile(key, val);
  notify(key, value);
}

// Async Save a value to disk and cache it
export async function setItemAsync(
  key: string,
  value: FTONData,
): Promise<void> {
  log(`Writing ${key}:`);
  log(value);
  const val: { [key: string]: FTONData } = {};
  val[key] = value;
  await writeFileAsync(key, val);
  notify(key, value);
}

// Delete an item (and remove it from the cache)
export function deleteItem(key: string): void {
  log(`deleting ${key}`);
  deleteFile(key);
}

// Async Delete an item (and remove it from the cache)
export async function deleteItemAsync(key: string): Promise<void> {
  log(`deleting ${key}`);
  await deleteFileAsync(key);
}

const makeWindowPos = (
  x: number,
  y: number,
  width: number,
  height: number,
  isMaximized: boolean,
) => ({ bounds: { x, y, width, height }, isMaximized });

const defaultWindowPosition: WindowPosition = makeWindowPos(
  Number.MIN_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
  900,
  680,
  false,
);

export function getWindowPos(): WindowPosition {
  try {
    const tmpws: any = getItem('windowPosition');
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
          tmpws.isMaximized,
        );
      }
    }
  } catch (err) {}
  return defaultWindowPosition;
}

export function setWindowPos(st: WindowPosition): void {
  setItem('windowPosition', st as FTONData);
}

export function getBrowserWindowPos(st: WindowPosition): Rectangle {
  if (
    st.bounds.x === Number.MIN_SAFE_INTEGER ||
    st.bounds.y === Number.MIN_SAFE_INTEGER ||
    st.bounds.x === undefined ||
    st.bounds.y === undefined
  ) {
    return {
      width: st.bounds.width,
      height: st.bounds.height,
    } as Rectangle;
  }

  return {
    width: st.bounds.width,
    height: st.bounds.height,
    x: st.bounds.x,
    y: st.bounds.y,
  };
}