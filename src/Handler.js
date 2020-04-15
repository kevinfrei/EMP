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
logger.enable('handler');

let lastSavedConfig: ?Array<string> = null;

const getKeyValue = (data: string): ?KeyValue => {
  try {
    const action: mixed = FTON.parse(data);
    if (
      typeof action === 'object' &&
      action !== null &&
      action.hasOwnProperty('key') &&
      typeof action.key === 'string' &&
      action.hasOwnProperty('value')
    ) {
      return { key: action.key, value: action.value };
    }
  } catch (e) {}
};

function setEqual<T>(a1: Array<T>, a2: Array<T>): boolean {
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

const StoreFromMainHandler = (store: Store<State>, message: string) => {
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
    log('Exception in StoreFromMainHandler:');
    log(e);
  }
  log('An error occurred');
  log(message);
};

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

// For anything that should be synchronized, do the store.on('') thing
// TODO: Debounce saving stuff
// TODO: Make this a more trivially configurable kind of thing
// TODO: Document this. Seriously. Rediscovering how this works is a PITA
const ConfigureIPC = (store: Store<State>) => {
  log('Store:');
  log(store);
  log('window.ipc');
  log(window.ipc);
  store.on('locations').subscribe((val: Array<string>) => {
    if (lastSavedConfig == null || !setEqual(lastSavedConfig, val)) {
      lastSavedConfig = val;
      window.ipc.send('set', FTON.stringify({ key: 'locations', value: val }));
    }
  });
  store.on('nowPlaying').subscribe((val: PlaySet) => {
    window.ipc.send('set', FTON.stringify({ key: 'nowPlaying', value: val }));
  });
  window.ipc.on('data', (event: IpcRendererEvent, message: string) => {
    DataFromMainHandler(store, message);
  });
  window.ipc.on('store', (event: IpcRendererEvent, message: string) => {
    StoreFromMainHandler(store, message);
  });
  window.ipc.on('asdf', () => {});
  window.ipc.send('get', 'nowPlaying');
  window.ipc.send('get', 'locations');
  window.ipc.send('GetDatabase', 'GetDatabase');
};

export { ConfigureIPC };
