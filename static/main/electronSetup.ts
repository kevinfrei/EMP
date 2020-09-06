import { app, BrowserWindow } from 'electron';
import path from 'path';
import { logger } from '@freik/simplelogger';

import { configureProtocols } from './configure';
import * as persist from './persist';

import type { WindowPosition } from './persist';

export type OnWindowCreated = (window: BrowserWindow) => Promise<void>;

const isDev = true; // require('electron-is-dev');

const log = logger.bind('electronSetup');
logger.disable('electronSetup');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;

export default function setup(windowCreated: OnWindowCreated): void {
  const windowPos: WindowPosition = persist.getWindowPos();

  const createWindow = () => {
    configureProtocols();
    // Create the window, but don't show it just yet
    mainWindow = new BrowserWindow({
      ...persist.getBrowserWindowPos(windowPos),
      title: 'EMP: Electron Music Player',
      //    backgroundColor: '#282c34', // Unnecessary if you're not showing :)
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        enableRemoteModule: true,
        webSecurity: !isDev,
      },
      titleBarStyle: 'hiddenInset', // TODO: Only Mac
      frame: false, // TODO: !Mac, add close/min/max buttons
      show: false,
      minWidth: 660,
      minHeight: 260,
    });
    // Load the base URL
    mainWindow
      .loadURL(
        isDev
          ? 'http://localhost:3000'
          : // If this file moves, you have to fix this to make it work for release
            `file://${path.join(__dirname, '../../build/index.html')}`,
      )
      .catch(log);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });

    app
      .whenReady()
      .then(() => {
        if (isDev) {
          log('Trying to install devtools');
          // Load the react developer tools if we're in development mode
          /* eslint-disable */
          const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS,
            REDUX_DEVTOOLS,
          } = require('electron-devtools-installer');

          installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
            .then((name: string) => log(`Added Extension:  ${name}`))
            .catch((err: Error) => log('An error occurred: ', err));
          /* eslint-enable */
        }
      })
      .catch(log);
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
        windowCreated(mainWindow).catch((e) => log(e));
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
        persist.setWindowPos(windowPos);
      }
    };

    mainWindow.on('resize', updateWindowPos);
    mainWindow.on('move', updateWindowPos);
    mainWindow.on('close', updateWindowPos);
  };

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });
}
