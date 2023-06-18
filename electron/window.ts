import {
  GetBrowserWindowPos,
  LoadWindowPos,
  setMainWindow,
} from '@freik/electron-main';
import { MakeLog } from '@freik/logger';
import { isNumber } from '@freik/typechk';
import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  app,
  screen,
} from 'electron';
import * as path from 'path';
import process from 'process';
import { OnWindowCreated } from './electronSetup';

const { wrn } = MakeLog('EMP:main:window');

// This should control access to the main window
// No one should keep any references to the main window (so it doesn't leak)
// which is the entire reason for this module's existence.

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;

export function HasWindow(): boolean {
  return mainWindow !== null;
}

export async function CreateWindow(
  windowCreated: OnWindowCreated,
): Promise<void> {
  // Create the window, but don't show it just yet
  const opts: BrowserWindowConstructorOptions = {
    ...GetBrowserWindowPos(LoadWindowPos()),
    title: 'EMP: Electron Music Player',
    // backgroundColor: '#282c34', // Unnecessary if you're not showing :)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webSecurity: app.isPackaged,
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
  };
  if (process.platform === 'darwin') {
    opts.titleBarStyle = 'hidden';
  }
  mainWindow = new BrowserWindow(opts).on('ready-to-show', () => {
    // Wait to show the main window until it's actually ready...
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      // TODO: On Mac, there's 'full screen max' and then 'just big'
      // This code makes full screen max turn into just big
      const windowPos = LoadWindowPos();
      if (windowPos.isMaximized) {
        mainWindow.maximize();
      }
      // Call the user specified "ready to go" function
      windowCreated()
        .then(() => {
          // open the devtools
          if (!app.isPackaged) {
            mainWindow?.webContents.openDevTools();
          }
        })
        .catch(wrn);
    }
  });

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send(
      'main-process-message',
      new Date().toLocaleString(),
    );
  });

  setMainWindow(mainWindow);

  // Load the base URL
  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL, {
      extraHeaders: 'pragma: no-cache\n',
    });
  } else {
    await mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

let prevWidth = 0;

export function ToggleMiniPlayer(): void {
  const windowPos = LoadWindowPos();
  if (
    mainWindow !== null &&
    isNumber(windowPos.bounds.x) &&
    isNumber(windowPos.bounds.y)
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
      // We're currently in the mini-player, switch to normal
      // TODO: Update the menu?
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
      // We're in a normal view. Switch to mini-player
      prevWidth = windowPos.bounds.width;
      if (atRightEdge) {
        const x = display.bounds.x + display.bounds.width - 270;
        mainWindow.setPosition(x, windowPos.bounds.y);
      }
      mainWindow.setSize(270, windowPos.bounds.height);
    }
  }
}

export function CloseWindow(): Promise<void> {
  if (mainWindow) {
    mainWindow.close();
  }
  return Promise.resolve();
}

export function MinimizeWindow(): Promise<void> {
  if (mainWindow) {
    mainWindow.minimize();
  }
  return Promise.resolve();
}

export function RestoreWindow(): Promise<void> {
  if (mainWindow) {
    mainWindow.restore();
  }
  return Promise.resolve();
}

export function MaximizeWindow(): Promise<void> {
  if (mainWindow) {
    mainWindow.maximize();
  }
  return Promise.resolve();
}
