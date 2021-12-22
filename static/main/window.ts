import { MakeError, Type } from '@freik/core-utils';
import {
  GetBrowserWindowPos,
  getMainWindow,
  LoadWindowPos,
} from '@freik/elect-main-utils';
import { BrowserWindow, screen } from 'electron';
import isDev from 'electron-is-dev';
import * as path from 'path';
import { OnWindowCreated } from './electronSetup';
import { RegisterListeners, RegisterProtocols } from './protocols';

// This should control access to the main window
// No one should keep any references to the main window (so it doesn't leak)
// which is the entire reason for this module's existence.

const err = MakeError('window-err');

export function HasWindow(): boolean {
  return getMainWindow() !== null;
}

export async function CreateWindow(
  windowCreated: OnWindowCreated,
): Promise<void> {
  await RegisterProtocols();
  RegisterListeners();
  // Create the window, but don't show it just yet
  const windowPos = LoadWindowPos();
  const theWin = new BrowserWindow({
    ...GetBrowserWindowPos(windowPos),
    title: 'EMP: Electron Music Player',
    // backgroundColor: '#282c34', // Unnecessary if you're not showing :)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      // enableRemoteModule: true,
      webSecurity: !isDev,
      contextIsolation: false,
    },
    frame: false,
    show: false,
    autoHideMenuBar: true,
    minWidth: 270,
    minHeight: 308,
    /*
    This exposes a bug in Electron where it won't quit/close. I should report it
    roundedCorners: false, // Square corners? Not sure...
    */
    fullscreenable: false,
    acceptFirstMouse: true, // Gets 'activating' clicks
  }).on('ready-to-show', () => {
    // Wait to show the main window until it's actually ready...
    const aWindow = getMainWindow();
    if (aWindow) {
      aWindow.show();
      aWindow.focus();
      // TODO: On Mac, there's 'full screen max' and then 'just big'
      // This code makes full screen max turn into just big
      if (windowPos.isMaximized) {
        aWindow.maximize();
      }
      // Call the user specified "ready to go" function
      windowCreated().catch(err);
      // open the devtools
      if (isDev) {
        aWindow.webContents.openDevTools();
      }
    }
  });
  theWin
    .loadURL(
      isDev
        ? 'http://localhost:3000'
        : // If this file moves, you have to fix this to make it work for release
          `file://${path.join(__dirname, '../index.html')}`,
    )
    .catch(err);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

let prevWidth = 0;

export function ToggleMiniPlayer(): void {
  const mainWindow = getMainWindow();
  const windowPos = LoadWindowPos();
  if (
    mainWindow !== null &&
    Type.isNumber(windowPos.bounds.x) &&
    Type.isNumber(windowPos.bounds.y)
  ) {
    const display = screen.getDisplayMatching(
      windowPos.bounds as Electron.Rectangle,
    );
    // TODO: Make this thing stick to the sides of the screen
    const atRightEdge =
      Math.abs(
        display.bounds.x +
          display.bounds.width -
          windowPos.bounds.x -
          windowPos.bounds.width,
      ) < 20;
    if (windowPos.bounds.width < 450) {
      const newWidth = Math.max(prevWidth, 570);
      if (atRightEdge) {
        mainWindow.setPosition(
          display.bounds.x + display.bounds.width - newWidth,
          windowPos.bounds.y,
        );
      }
      mainWindow.setSize(newWidth, windowPos.bounds.height);
      prevWidth = 0;
    } else {
      prevWidth = windowPos.bounds.width;
      if (atRightEdge) {
        const x = display.bounds.x + display.bounds.width - 270;
        mainWindow.setPosition(x, windowPos.bounds.y);
      }
      mainWindow.setSize(270, windowPos.bounds.height);
    }
  }
}
