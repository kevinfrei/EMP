// @flow

import logger from 'simplelogger';

import type { IpcRendererEvent } from 'electron';
import type { Store } from 'undux';
import type { State } from './MyStore';

const log = logger.bind('handler');
//logger.disable('handler');

let lastSavedConfig = null;

function setEqual<T>(s1: Set<T>, s2: Set<T>): boolean {
  if (s1.size !== s2.size) {
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
  // TODO: Make this do real stuff
  const action = JSON.parse(message);
  log('Received a message from the Main process:');
  log(action);
  const [msg, num] = message.split(':');
  if (num !== undefined) {
    const val: number = Number.parseInt(num);
    store.set('foo')(val);
  }
  store.set('bar')(msg);
};

/*
const AsyncReplyHandler = (
  store: Store<State>,
  event: Object,
  ...args: Array<string>
) => {
  if (store.get('request') !== 'sent') {
    // TODO: Make sure this is handled properly somehow
    log(
      'Reply received but request not sent, already replied to, or overlapped.'
    );
    return;
  }
  store.set('request')('none');
  // TODO: Handle the async reply here...
};
*/
const ConfigureIPC = (store: Store) => {
  log('Store:');
  log(store);
  log('window.ipc');
  log(window.ipc);
  store.on('Configuration').subscribe((val: Set<string>) => {
    if (lastSavedConfig == null || !setEqual(lastSavedConfig, val)) {
      lastSavedConfig = val;
      window.ipc.send(
        'set',
        JSON.stringify({ key: 'locations', value: [...val] })
      );
    }
  });
  window.ipc.on('data', (event: IpcRendererEvent, message: string) => {
    log('Async message from main:');
    log(event);
    log(`Message: '${message}'`);
    // log(window.store);
    MessageFromMainHandler(store, message);
  });
};

export { ConfigureIPC };
