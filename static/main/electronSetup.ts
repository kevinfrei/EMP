import { MakeError, MakeLogger } from '@freik/core-utils';
import { app } from 'electron';
import isDev from 'electron-is-dev';
import { CreateWindow, HasWindow } from './window';

export type OnWindowCreated = () => Promise<void>;

const log = MakeLogger('electronSetup');
const err = MakeError('electronSetup-err');

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
      try {
        const name = await installExtension(REACT_DEVELOPER_TOOLS);
        console.log('Added Extension: ' + name);
      } catch (e) {
        console.log(
          'An error occurred while trying to load the React Dev Tools:',
        );
        console.log(e);
      }
      /* eslint-enable */
    } catch (e) {
      /* */
    }
  }
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  CreateWindow(windowCreated);
}

export function StartApp(windowCreated: OnWindowCreated): void {
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

  WhenReady(windowCreated)
    .then(() => log('App Launched'))
    .catch((e) => {
      err('App Launch exception');
      err(e);
    });
}
