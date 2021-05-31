import { MakeError, MakeLogger } from '@freik/core-utils';
import { app } from 'electron';
import isDev from 'electron-is-dev';
import { MakeMainMenu } from './menu';
import { CreateWindow, HasWindow } from './window';

app.commandLine.appendSwitch('disable-http-cache');

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
  /*
  globalShortcut.unregister('MediaNextTrack');
  globalShortcut.unregister('MediaPreviousTrack');
  globalShortcut.unregister('MediaPlayPause');
  */
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
  await CreateWindow(windowCreated);
}

export async function StartApp(windowCreated: OnWindowCreated): Promise<void> {
  // Make & attach the application-wide menu
  MakeMainMenu();

  // Quit when all windows are closed.
  app
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // But tough crap: This feels more sensible
    // if (process.platform !== 'darwin') {
    .on('window-all-closed', () => app.quit())
    .on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (!HasWindow()) {
        CreateWindow(windowCreated).catch(err);
      }
    })
    .on('will-quit', unregisterGlobalShortcuts);

  await WhenReady(windowCreated);
  registerGlobalShortcuts();
}
