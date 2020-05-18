// @flow

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron');
const isDev = require('electron-is-dev');
const logger = require('simplelogger');
const { PromiseIpc } = require('electron-promise-ipc');

const log = logger.bind('renderer');
//logger.disable('renderer');

// This will expose the ipcRenderer (and isDev) interfaces for use by the
// React components, then, assuming the index.js has already be invoked, it
// calls the function to start the app, thus ensuring that the app has access
// to the ipcRenderer to enable asynchronous callbacks to affect the Undux store

window.addEventListener('DOMContentLoaded', () => {
  window.ipc = ipcRenderer;
  window.remote = remote;
  if (isDev) {
    window.isDev = isDev;
  }
  log('ready');
  if (window.initApp !== undefined) {
    window.initApp();
  } else {
    log('FAILURE: No window.initApp() attached.');
  }
  console.log('Setting up PromiseIPC:');
  window.ipcPromise = new PromiseIpc({ maxTimeoutMs: 5000 });
  console.log(window.ipcPromise);
});
