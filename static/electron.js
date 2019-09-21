// @flow

const { ipcMain } = require('electron');

const path = require('path');
const setup = require('./electronSetup');

import type { WebContents, BrowserWindow } from 'electron';
import type { OnWindowCreated } from './electronSetup';

const onWindowCreated:OnWindowCreated = (window: BrowserWindow):void => {
  window.webContents.send('asynchronous-message', 'HOWDY!');
};

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log('Received async message');
  console.log(event);
  console.log('arg:');
  console.log(arg); // prints "ping"
  event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('synchronous-message', (event, arg) => {
  console.log('Received sync message');
  console.log(event);
  console.log('arg:');
  console.log(arg); // prints "ping"
  event.returnValue = 'pong';
});

setup(onWindowCreated);
