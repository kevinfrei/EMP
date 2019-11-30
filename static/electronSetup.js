// @flow

const { app, protocol, BrowserWindow } = require('electron');

const path = require('path');
const isDev = require('electron-is-dev');
const logger = require('simplelogger');

const persist = require('./persist');

import type { WindowPosition } from './persist';

export type OnWindowCreated = (window: BrowserWindow) => void;

//logger.disable('electronSetup');
const log = (...args: Array<mixed>) => logger('electronSetup', ...args);

/*
protocol.registerSchemesAsPrivileged([
  { scheme: 'pic', privileges: { standard: true, secure: true } },
  { scheme: 'tune', privileges: { standard: true, secure: true } }
]);
*/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: ?BrowserWindow = null;
const configureProtocols = () => {
  protocol.registerFileProtocol(
    'pic',
    (req, callback) => {
      log('pic URL request:');
      log(req);
      callback({ path: path.join(__dirname, 'logo512.png') });
    },
    error => {
      if (error) {
        log('failed to register "pic" protocol:');
        log(error);
      }
    }
  );
  protocol.registerFileProtocol(
    'tune',
    (req, callback) => {
      log('tune URL request:');
      log(req);
      const thePath =
        '/Volumes/Thunderbolt/Audio/Sorted/Sorted/Accurate/Kate Bush - 1993 - The Red Shoes/01 - Rubberband Girl.flac'; //path.join(__dirname, 'test.flac');
      log('Returning path ' + thePath);
      callback({ path: thePath });
    },
    error => {
      if (error) {
        log('failed to register "tune" protocol:');
        log(error);
      }
    }
  );
};

const setup = (windowCreated: OnWindowCreated) => {
  const windowPos: WindowPosition = persist.getWindowPos();

  const createWindow = () => {
    configureProtocols();
    // Create the window, but don't show it just yet
    mainWindow = new BrowserWindow({
      ...persist.getBrowserWindowPos(windowPos),
      //    backgroundColor: '#282c34', // Unnecessary if you're not showing :)
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true
      },
      show: false
    });
    // Load the base URL
    mainWindow.loadURL(
      isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`
    );

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });

    // Wait to show the main window until it's actually ready...
    mainWindow.on('ready-to-show', () => {
      if (mainWindow) {
        if (isDev) {
          // Load the react developer tools if we're in development mode
          const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS
          } = require('electron-devtools-installer');

          installExtension(REACT_DEVELOPER_TOOLS)
            .then(name => log(`Added Extension:  ${name}`))
            .catch(err => log('An error occurred: ', err));
        }
        mainWindow.show();
        mainWindow.focus();
        // TODO: On Mac, there's 'full screen max' and then 'just big'
        // This code makes full screen max turn into just big
        if (windowPos.isMaximized) {
          mainWindow.maximize();
        }
        // Call the user specified "ready to go" function
        windowCreated(mainWindow);
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

    ['resize', 'move', 'close'].forEach(e => mainWindow.on(e, updateWindowPos));
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
};

module.exports = setup;
