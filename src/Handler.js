// @flow

import logger from 'simplelogger';

import type { IpcRendererEvent } from 'electron';
import type { Store } from 'undux';
import type { State } from './MyStore';

const log = logger.bind('handler');
//logger.disable('handler');

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
    const action = JSON.parse(message);
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
      log('Store:');
      log(store);
      const setter = store.set(action.key);
      log('Setter:');
      log(setter);
      setter(action.value);
    }
  } catch (e) {}
  log('An error occurred');
  log(message);
};

const ConfigureIPC = (store: Store) => {
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

export { ConfigureIPC };
