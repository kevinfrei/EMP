import { MakeError, MakeLogger } from '@freik/core-utils';
import { app, globalShortcut } from 'electron';
import isDev from 'electron-is-dev';
import { makeMainMenu } from './menu';
import { CreateWindow, HasWindow } from './window';

export type OnWindowCreated = () => Promise<void>;

const log = MakeLogger('electronSetup');
const err = MakeError('electronSetup-err');

function registerGlobalShortcuts() {
  /*
  globalShortcut.register('MediaNextTrack', () => {});
  globalShortcut.register('MediaPreviousTrack', () => {});
  globalShortcut.register('MediaPlayPause', () => {});
  */
}

function unregisterGlobalShortcuts() {
  globalShortcut.unregister('MediaNextTrack');
  globalShortcut.unregister('MediaPreviousTrack');
  globalShortcut.unregister('MediaPlayPause');
}

async function WhenReady(windowCreated: OnWindowCreated) {
  await app.whenReady();
  if (isDev) {
    try {
      // Load the react developer tools if we're in development mode
      /* eslint-disable */
      const {
        default: installExtension,
        REACT_DEVELOPER_TOOLS,
      } = require('electron-devtools-installer');
      const name = await installExtension(REACT_DEVELOPER_TOOLS);
      log('Added Extension: ' + name);
      /* eslint-enable */
    } catch (e) {
      err('An error occurred while trying to load the React Dev Tools:');
      err(e);
    }
  }
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  CreateWindow(windowCreated);
}

export function StartApp(windowCreated: OnWindowCreated): void {
  // Make & attach the application-wide menu
  makeMainMenu();

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
    if (!HasWindow()) {
      CreateWindow(windowCreated);
    }
  });

  app.on('will-quit', () => unregisterGlobalShortcuts());

  WhenReady(windowCreated)
    .then(() => {
      registerGlobalShortcuts();
      log('App Launched');
    })
    .catch((e) => {
      err('App Launch exception');
      err(e);
    });
}
