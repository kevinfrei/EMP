// @flow

import logger from 'simplelogger';
import { FTON } from 'my-utils';
import { Comparisons } from 'my-utils';

import { ValidKeyNames } from './MyStore';

import { PlaysetsComp } from './Sorters';

import type { IpcRendererEvent } from 'electron';
import type { StoreState } from './MyStore';

export type KeyValue = {
  key: string,
  value: mixed,
};

const log = logger.bind('handler');
logger.disable('handler');

const DataFromMainHandler = (store: StoreState, message: string) => {
  try {
    const action: mixed = FTON.parse(message);
    log('Store message from main process:');
    log(action);
    if (
      typeof action === 'object' &&
      action !== null &&
      action.hasOwnProperty('key') &&
      typeof action.key === 'string' &&
      action.hasOwnProperty('value')
    ) {
      const key: string = action.key;
      log(`Message to set ${key} to `);
      log(action.value);
      // Validate that the key is valid
      if (ValidKeyNames.indexOf(key) >= 0) {
        store.set(key)(action.value);
        return;
      } else {
        log('Invalid key name');
      }
    }
  } catch (e) {
    log('Exception!');
    log(e);
  }
  log('An error occurred');
  log(message);
};

// I need a "has this changed" function, along with a debounce config
type HasChangedFunc<T> = (value: T) => boolean;
type Comparer<T> = (v1: T, v2: T) => boolean;
type SaveConfig<T> = {
  key: string,
  hasChanged: HasChangedFunc<T>,
  delay: number,
  maxDelay: number,
  timeout: ?number,
  maxtimeout: ?number,
};

// This is a helper that saves a default value in the local closure, and
// returns the struture used to decide if we should send this data back to the
// main process to be saved or not
function makeChangeChecker<T>(
  key: string,
  def: T,
  comp: Comparer<T>,
  delay: number,
  maxDelay: number
): SaveConfig<T> {
  let prevVal: T = FTON.parse(FTON.stringify(def));
  const hasChanged = (obj: T): boolean => {
    if (!comp(prevVal, obj)) {
      prevVal = FTON.parse(FTON.stringify(def));
      return true;
    }
    return false;
  };
  return { key, hasChanged, delay, maxDelay, timeout: null, maxtimeout: null };
}

// For each key that should be saved to main (and persisted between runs)
// add a "change checker" here.
const PersistedBetweenRuns: Array<SaveConfig<T>> = [
  makeChangeChecker('locations', null, Comparisons.ArraySetEqual, 1, 10),
  makeChangeChecker('songList', [], Comparisons.ArraySetEqual, 500, 1500),
  makeChangeChecker(
    'activePlaylistName',
    '',
    Comparisons.StringCaseInsensitiveEqual,
    50,
    150
  ),
  makeChangeChecker('Playlists', new Map(), PlaysetsComp, 100, 1000),
];

// This registers store subscribers for state changes we're watching
// and requests the initial values from the main process
const HandlePersistence = (store: StoreState) => {
  for (let key of PersistedBetweenRuns) {
    log(`key: ${key.key} subscription`);
    store.on(key.key).subscribe((value) => {
      if (key.hasChanged(value)) {
        // Cancel the current scheduled update
        if (key.timeout !== null) {
          window.clearTimeout(key.timeout);
        }
        // Set this to update in key.delay ms
        key.timeout = window.setTimeout(() => {
          // send the packet and cancel the maxDelay
          const mto = key.maxtimeout;
          key.maxtimeout = null;
          key.timeout = null;
          if (mto !== null) {
            window.clearTimeout(mto);
          }
          if (key.hasChanged(value)) {
            window.ipc.send('set', FTON.stringify({ key: key.key, value }));
          }
        }, key.delay);
        // If we haven't got a maxtimeout counting down, set one of those too
        if (key.maxtimeout === null) {
          key.maxtimeout = window.setTimeout(() => {
            key.maxtimeout = null;
            if (key.hasChanged(value)) {
              window.ipc.send('set', FTON.stringify({ key: key.key, value }));
            }
          }, key.maxDelay);
        }
      }
    });
    window.ipc.send('get', key.key);
  }
};

// For anything that should be synchronized, update the effects in Effects.js
const ConfigureIPC = (store: StoreState) => {
  log('Store:');
  log(store);
  log('window.ipc');
  log(window.ipc);
  // Handle the 'automatic' persistence stuff
  HandlePersistence(store);
  window.ipc.on('data', (event: IpcRendererEvent, message: string) => {
    DataFromMainHandler(store, message);
  });
  window.ipc.on('store', (event: IpcRendererEvent, message: string) => {
    DataFromMainHandler(store, message);
  });
  window.ipc.send('GetDatabase', 'GetDatabase');
  window.ipc.on('mediainfo', (event: IpcRendererEvent, message: string) => {
    log('mediainfo received');
    log(message);
    const data = FTON.parse(message);
    if (!data) return;
    if (typeof data !== 'object') return;
    if (typeof data.key !== 'string') return;
    if (typeof data.data !== 'object') return;
    const mi = store.get('MediaInfoCache');
    mi.set(data.key, data.data);
    store.set('MediaInfoCache')(mi);
  });
};

export { ConfigureIPC };
