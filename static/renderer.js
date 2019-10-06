// @flow

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require('fs');
const { ipcRenderer } = require('electron');
const isDev = require('electron-is-dev');

import type { IpcRendererEvent } from 'electron';

// This is where we start getting stuff from the main process without asking
if (false) {
  ipcRenderer.on(
    'asynchronous-message',
    (event: IpcRendererEvent, message: string) => {
      if (isDev) {
        console.log('Async message from main:');
        console.log(event);
        console.log(`Message: '${message}'`);
        //      console.log(window.store);
      }
      const val = Number.parseInt(message.split(':')[1]);
      if (window.store) {
        const store = window.store.useStore();
        store.set('foo', val);
      }
    }
  );
}

//const files = fs.readdirSync('/Users/freik');
// An example of us starting communication with the main process
/*
ipcRenderer.on('asynchronous-reply', (event, ...args) => {
  console.log('Async reply:');
  console.log(event);
  console.log('args:');
  console.log(args);
});
ipcRenderer.send('asynchronous-message', 'ping');
*/
const doSomething = () => {
  window.ipc = ipcRenderer;
  window.isDev = isDev;
  console.log('ready');
  if (window.initApp !== undefined) {
    window.initApp();
  } else {
    console.log("FAILURE: No window.initApp() attached.");
  }
};

window.addEventListener('DOMContentLoaded', doSomething);
