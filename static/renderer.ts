// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import { IpcRenderer, ipcRenderer, remote } from 'electron';
import { logger } from '@freik/simplelogger';
import { PromiseIpcRenderer } from 'electron-promise-ipc/build/renderer';
import { ipcRenderer as betterIpc } from '@freik/electron-better-ipc';

import type { RendererProcessIpc } from '@freik/electron-better-ipc';

const isDev = true; // require('electron-is-dev');

const log = logger.bind('renderer');
// logger.enable('renderer');

interface MyWindow extends Window {
  ipc: IpcRenderer | undefined;
  remote: Electron.Remote | undefined;
  isDev: boolean | undefined;
  initApp: undefined | (() => void);
  ipcPromise: PromiseIpcRenderer | undefined;
  betterIpc: RendererProcessIpc | undefined;
}
declare let window: MyWindow;

// This will expose the ipcRenderer (and isDev) interfaces for use by the
// React components, then, assuming the index.js has already be invoked, it
// calls the function to start the app, thus ensuring that the app has access
// to the ipcRenderer to enable asynchronous callbacks to affect the Undux store

window.addEventListener('DOMContentLoaded', () => {
  window.ipc = ipcRenderer;
  log('About to attach the remote');
  if (remote) {
    window.remote = remote;
  } else {
    log('remote is falsy :(');
  }
  if (isDev) {
    window.isDev = isDev;
  }
  log('ready');
  if (window.initApp) {
    window.initApp();
  } else {
    log('FAILURE: No window.initApp() attached.');
  }
  log('Setting up PromiseIPC:');
  window.ipcPromise = new PromiseIpcRenderer({ maxTimeoutMs: 5000 });
  log(window.ipcPromise);
  log('adding betterIpc');
  window.betterIpc = betterIpc;
});
