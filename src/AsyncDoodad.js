// @flow

import * as React from 'react';
import Store from './MyStore';
import { AsyncMessageHandler, AsyncReplyHandler } from './Handler';
import logger from 'simplelogger';

import type { IpcRendererEvent } from 'electron';

const log = logger.bind('async');
logger.disable('async');

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
};

const AsyncDoodad = () => {
  const store = Store.useStore();
  let lastSavedConfig: ?Set<string> = null;
  store.on('Configuration').subscribe((val: Set<string>) => {
    if (lastSavedConfig == null || !setEqual(lastSavedConfig, val)) {
      lastSavedConfig = val;
      const message = { cmd: 'save-config', value: [...val] };
      window.ipc.send('asynchronous-message', message);
      // TODO: Save this over in main process land!
    }
  });
  if (window.ipc === undefined) {
    log('No IPC');
  } else if (window.ipcSet === undefined) {
    log('IPC initialized');
    window.ipcSet = true;
    window.ipc.on(
      'asynchronous-message',
      (event: IpcRendererEvent, message: string) => {
        if (window.isDev) {
          log('Async message from main:');
          log(event);
          log(`Message: '${message}'`);
          // log(window.store);
        }
        AsyncMessageHandler(store, message);
      }
    );
    window.ipc.on(
      'asynchronous-reply',
      (event: IpcRendererEvent, ...args: Array<string>) => {
        if (window.isDev) {
          log('Async reply:');
          log(event);
          log('args:');
          log(args);
        }
        AsyncReplyHandler(store, event, ...args);
      }
    );
  }
  if (window.ipc !== undefined) {
    // I'm not sure about this, but I want to keep my IPC centralized, so
    // I think I should to respond to state changes requested in the store,
    // instead of spreading ipc.send's all over the codebase
    const request = store.get('request');
    if (request !== 'none' && request !== 'sent') {
      window.ipc.send('asynchronous-message', request);
      store.set('request')('sent');
    }
  }
  // Invisible, because this is just for listening to the main process
  return <div id="async-doodad" style={{ display: 'none' }} />;
};

export default AsyncDoodad;
