import { MakeError } from '@freik/core-utils';
import { BrowserWindow } from 'electron';
import isDev from 'electron-is-dev';
import * as path from 'path';
import { configureListeners, configureProtocols } from './conf-protocols';
import { OnWindowCreated } from './electronSetup';
import {
  getBrowserWindowPos,
  getWindowPos,
  setWindowPos,
  WindowPosition,
} from './persist';

// This should control access to the main window
// No one should keep any references to the main window (so it doesn't leak)
// which is the entire reason for this module's existence.

const err = MakeError('window-err');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;

export function HasWindow(): boolean {
  return mainWindow !== null;
}

export function SendToMain(channel: string, ...data: any[]): void {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

const windowPos: WindowPosition = getWindowPos();

export function CreateWindow(windowCreated: OnWindowCreated): void {
  configureProtocols();
  configureListeners();
  // Create the window, but don't show it just yet
  mainWindow = new BrowserWindow({
    ...getBrowserWindowPos(windowPos),
    title: 'EMP: Electron Music Player',
    // backgroundColor: '#282c34', // Unnecessary if you're not showing :)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: !isDev,
    },
    titleBarStyle: 'hiddenInset', // TODO: Only Mac
    frame: true, // TODO: !Mac, add close/min/max buttons
    show: false,
    autoHideMenuBar: true,
    minWidth: 270,
    minHeight: 308,
  });

  // Load the base URL
  mainWindow
    .loadURL(
      isDev
        ? 'http://localhost:3000'
        : // If this file moves, you have to fix this to make it work for release
          `file://${path.join(__dirname, '../index.html')}`,
    )
    .catch(err);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    // Clear the reference to the window object.
    // Usually you would store windows in an array.
    // If your app supports multiple windows, this is the time when you should
    // delete the corresponding element.
    mainWindow = null;
  });

  // Wait to show the main window until it's actually ready...
  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      // TODO: On Mac, there's 'full screen max' and then 'just big'
      // This code makes full screen max turn into just big
      if (windowPos.isMaximized) {
        mainWindow.maximize();
      }
      // Call the user specified "ready to go" function
      windowCreated().catch(err);
    }
  });

  const updateWindowPos = () => {
    // Get the window state & save it
    if (mainWindow) {
      windowPos.isMaximized = mainWindow.isMaximized();
      if (!windowPos.isMaximized) {
        // only update bounds if the window isn’t currently maximized
        windowPos.bounds = mainWindow.getBounds();
      }
      setWindowPos(windowPos);
    }
  };

  mainWindow.on('resize', updateWindowPos);
  mainWindow.on('move', updateWindowPos);
  mainWindow.on('close', updateWindowPos);
}
