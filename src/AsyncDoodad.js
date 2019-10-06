// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import Store from './MyStore';
import Handler from './Handler';

import type { IpcRendererEvent } from 'electron';

const AsyncDoodad = () => {
  const store = Store.useStore();
  if (window.ipc === undefined) {
    console.log('No IPC');
  } else if (window.ipcSet === undefined) {
    console.log('IPC initialized');
    window.ipcSet = true;
    window.ipc.on(
      'asynchronous-message',
      (event: IpcRendererEvent, message: string) => {
        if (window.isDev) {
          console.log('Async message from main:');
          console.log(event);
          console.log(`Message: '${message}'`);
          //      console.log(window.store);
        }
        Handler(store, message);
      }
    );
  }
  // Invisible, because this is just for listening to the main process
  return <div style={{ display: 'none' }} />;
};

export default AsyncDoodad;
