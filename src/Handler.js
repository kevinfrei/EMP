// @flow

import logger from 'simplelogger';
import { ValidKeyNames } from './MyStore';

import type { IpcRendererEvent } from 'electron';
import type { Store } from 'undux';
import type { State } from './MyStore';

const log = logger.bind('handler');
logger.disable('handler');

let lastSavedConfig: ?Array<string> = null;

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

const MessageFromMainHandler = (store: Store<State>, message: string) => {
  try {
    const action: mixed = JSON.parse(message);
    log('Received a message from the Main process:');
    log(action);
    if (
      typeof action === 'object' &&
      action !== null &&
      action.hasOwnProperty('key') &&
      typeof action.key === 'string' &&
      action.hasOwnProperty('value')
    ) {
      log(`Message to set ${action.key} to `);
      log(action.value);
      // Validate that the key is valid
      if (ValidKeyNames.indexOf(action.key) >= 0) {
        const setter = store.set(action.key);
        setter(action.value);
      } else {
        log('Invalid key name');
      }
    }
  } catch (e) {}
  log('An error occurred');
  log(message);
};

const ConfigureIPC = (store: Store<State>) => {
  log('Store:');
  log(store);
  log('window.ipc');
  log(window.ipc);
  store.on('locations').subscribe((val: Array<string>) => {
    if (lastSavedConfig == null || !setEqual(lastSavedConfig, val)) {
      lastSavedConfig = val;
      window.ipc.send('set', JSON.stringify({ key: 'locations', value: val }));
    }
  });
  window.ipc.on('data', (event: IpcRendererEvent, message: string) => {
    log('Async message from main:');
    log(event);
    log(`Message: '${message}'`);
    MessageFromMainHandler(store, message);
  });
  window.ipc.send('get', 'locations');
};

export { ConfigureIPC, MessageFromMainHandler };
