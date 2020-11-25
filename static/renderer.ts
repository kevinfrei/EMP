// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import { MakeError } from '@freik/core-utils';
import { IpcRenderer, ipcRenderer, remote } from 'electron';
import isDev from 'electron-is-dev';

const err = MakeError('renderer-err');

interface MyWindow extends Window {
  ipc: IpcRenderer | undefined;
  remote: Electron.Remote | undefined;
  isDev: boolean | undefined;
  initApp: undefined | (() => void);
  ipcSet: boolean | undefined;
}

declare let window: MyWindow;

// This will expose the ipcRenderer (and isDev) interfaces for use by the
// React components, then, assuming the index.js has already be invoked, it
// calls the function to start the app, thus ensuring that the app has access
// to the ipcRenderer to enable asynchronous callbacks to affect the Undux store

window.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-debugger
  if (false) debugger;

  window.ipc = ipcRenderer;
  if (remote) {
    window.remote = remote;
  } else {
    err('remote is falsy :(');
  }
  if (isDev) {
    window.isDev = isDev;
  }
  if (window.initApp) {
    window.initApp();
  } else {
    err('FAILURE: No window.initApp() attached.');
  }
});
