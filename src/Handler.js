// @flow

import logger from 'simplelogger';
import { FTON } from 'my-utils';
import { ValidKeyNames } from './MyStore';

import type { IpcRendererEvent } from 'electron';
import type { Store } from 'undux';
import type { State, PlaySet } from './MyStore';

export type KeyValue = {
  key: string,
  value: mixed,
};

const log = logger.bind('handler');
logger.disable('handler');

function setEqual<T>(a1: Array<T>, a2: Array<T>): boolean {
  if ((a1 === undefined && a2 === undefined) || (a1 === null && a2 === null)) {
    return true;
  }
  if (!a1 || !a2) {
    return false;
  }
  const s1 = new Set(a1);
  const s2 = new Set(a2);
  if (a1.length !== a2.length) {
    return false;
  }
  for (let i of s1) {
    if (!s2.has(i)) {
      return false;
    }
  }
  return true;
}

// Returns true if psa and psb are equal
function playSetEqual(psa: PlaySet, psb: PlaySet): boolean {
  const psan = psa.name.toLocaleLowerCase();
  const psbn = psb.name.toLocaleLowerCase();
  if (psan.localeCompare(psbn)) {
    return false;
  }
  if (psa.pos !== psb.pos) {
    return false;
  }
  if (psa.songs.length !== psb.songs.length) {
    return false;
  }
  for (let i = 0; i < psa.songs.length; i++) {
    if (typeof psa.songs[i] !== typeof psb.songs[i]) {
      return false;
    }
    if (psa.songs[i] !== psb.songs[i]) {
      return false;
    }
  }
  return true;
}

const DataFromMainHandler = (store: Store<State>, message: string) => {
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
        const setter = store.set(key);
        setter(action.value);
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
  makeChangeChecker('locations', null, setEqual, 1, 10),
  makeChangeChecker(
    'nowPlaying',
    { name: '', pos: -1, songs: [] },
    playSetEqual,
    500,
    1500
  ),
];

// This registers store subscribers for state changes we're watching
// and requests the initial values from the main process
const HandlePersistence = (store: Store<State>) => {
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

// For anything that should be synchronized, do the store.on('') thing
// TODO: Debounce saving stuff
// TODO: Make this a more trivially configurable kind of thing
// TODO: Document this. Seriously. Rediscovering how this works is a PITA
const ConfigureIPC = (store: Store<State>) => {
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
};

export { ConfigureIPC };
