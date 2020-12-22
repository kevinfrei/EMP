import {
  FTON,
  FTONData,
  MakeError,
  MakeLogger,
  SeqNum,
} from '@freik/core-utils';
import { app, Rectangle } from 'electron';
import fs, { promises as fsp } from 'fs';
import path from 'path';

const log = MakeLogger('persist');
const err = MakeError('persist-err', false);

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

export type ValueUpdateListener = (val: string) => void;

export type Persist = {
  getItem: (key: string) => string | void;
  getItemAsync: (key: string) => Promise<string | void>;
  setItem(key: string, value: string): void;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItem(key: string): void;
  deleteItemAsync(key: string): Promise<void>;
  getWindowPos(): WindowPosition;
  setWindowPos(st: WindowPosition): void;
  getBrowserWindowPos(st: WindowPosition): Rectangle;
  subscribe(key: string, listener: ValueUpdateListener): string;
  unsubscribe(id: string): boolean;
};

const memoryCache = new Map<string, string>();
const listeners = new Map<string, Map<string, ValueUpdateListener>>();
const getNextListenerId = SeqNum();

let ploc: string | null = null;
// Here's a place for app settings & stuff...
function persistenceLocation(): string {
  if (!ploc) {
    ploc = path.join(app.getPath('userData'), 'PersistedData');
  }
  return ploc;
}
function storageLocation(id: string): string {
  return path.join(persistenceLocation(), `${id}.json`);
}

log(`User data location: ${storageLocation('test')}`);

function readFile(id: string): string | void {
  let data = memoryCache.get(id);
  if (data) {
    return data;
  }
  try {
    data = fs.readFileSync(storageLocation(id), 'utf8');
    memoryCache.set(id, data);
    return data;
  } catch (e) {
    err('Error occurred during readFile');
    err(e);
  }
}

async function readFileAsync(id: string): Promise<string | void> {
  const data = memoryCache.get(id);
  if (data) {
    log('returning cached data for ' + id);
    return data;
  }
  try {
    const contents = await fsp.readFile(storageLocation(id), 'utf8');
    memoryCache.set(id, contents);
    return contents;
  } catch (e) {
    err('Error occurred during readFileAsync');
    err(e);
  }
}

function writeFile(id: string, val: string): void {
  try {
    fs.mkdirSync(persistenceLocation(), { recursive: true });
  } catch (e) {
    /* */
  }
  fs.writeFileSync(storageLocation(id), val, 'utf8');
  memoryCache.set(id, val);
}

async function writeFileAsync(id: string, val: string): Promise<void> {
  try {
    await fsp.mkdir(persistenceLocation(), { recursive: true });
  } catch (e) {
    /* */
  }
  await fsp.writeFile(storageLocation(id), val, 'utf8');
  memoryCache.set(id, val);
}

function deleteFile(id: string) {
  try {
    fs.unlinkSync(storageLocation(id));
    memoryCache.delete(id);
  } catch (e) {
    err('Error occurred during deleteFile');
    err(e);
  }
}

async function deleteFileAsync(id: string) {
  try {
    await fsp.unlink(storageLocation(id));
    memoryCache.delete(id);
  } catch (e) {
    err('Error occurred during deleteFileAsync');
    err(e);
  }
}

function notify(key: string, val: string) {
  // For each listener, invoke the listening function
  const ls = listeners.get(key);
  if (!ls) return;
  for (const [, fn] of ls) {
    log(`Updating ${key} to ${val}`);
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
export function getItem(key: string): string | void {
  log('Reading ' + key);
  return readFile(key);
}

// Get a value from disk/memory
export async function getItemAsync(key: string): Promise<string | void> {
  log('Async Reading ' + key);
  return await readFileAsync(key);
}

// Save a value to disk and cache it
export function setItem(key: string, value: string): void {
  if (getItem(key) === value) {
    log(`No change to ${key} - not re-writing`);
  } else {
    log(`Writing ${key}:`);
    log(value);
    writeFile(key, value);
    notify(key, value);
  }
}

// Async Save a value to disk and cache it
export async function setItemAsync(key: string, value: string): Promise<void> {
  if ((await getItemAsync(key)) === value) {
    log(`No change to ${key} - not re-writing`);
  } else {
    log(`Async Writing ${key}:`);
    log(value);
    await writeFileAsync(key, value);
    notify(key, value);
  }
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
  Number.MIN_SAFE_INTEGER, // eslint-disable-line id-blacklist
  Number.MIN_SAFE_INTEGER, // eslint-disable-line id-blacklist
  900,
  680,
  false,
);

export function getWindowPos(): WindowPosition {
  try {
    const tmp = getItem('windowPosition');
    if (!tmp) {
      return defaultWindowPosition;
    }
    const tmpws = FTON.parse(tmp);
    if (tmpws && typeof tmpws === 'object' && 'bounds' in tmpws) {
      const bounds = tmpws.bounds;
      if (
        bounds &&
        typeof bounds === 'object' &&
        'x' in bounds &&
        typeof bounds.x === 'number' &&
        'y' in bounds &&
        typeof bounds.y === 'number' &&
        'width' in bounds &&
        typeof bounds.width === 'number' &&
        'height' in bounds &&
        typeof bounds.height === 'number' &&
        'isMaximized' in tmpws &&
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
  } catch (e) {
    err('Error occurred during getWindowPos');
    err(e);
  }

  return defaultWindowPosition;
}

export function setWindowPos(st: WindowPosition): void {
  setItem('windowPosition', FTON.stringify(st as FTONData));
}

export function getBrowserWindowPos(st: WindowPosition): Rectangle {
  if (
    st.bounds.x === Number.MIN_SAFE_INTEGER || // eslint-disable-line id-blacklist
    st.bounds.y === Number.MIN_SAFE_INTEGER || // eslint-disable-line id-blacklist
    !('x' in st.bounds) ||
    !('y' in st.bounds)
  ) {
    return {
      width: st.bounds.width,
      height: st.bounds.height,
    } as Rectangle;
  }

  return {
    width: st.bounds.width,
    height: st.bounds.height,
    x: (st.bounds.x as any) as number,
    y: (st.bounds.y as any) as number,
  };
}
