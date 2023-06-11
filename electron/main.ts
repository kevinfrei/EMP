import debug from 'debug';
import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { StartApp } from './electronSetup';
import { InitBeforeAnythingElse, WindowStartup } from './Startup';

const err = debug('EMP:main:electron');
err.enabled = true;

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │

process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
// Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL: string = process.env.VITE_DEV_SERVER_URL!;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
    title: 'EMP: Electron Music Player',
    // autoHideMenuBar: false,
    // frame: false,
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL).catch(err);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html')).catch(err);
  }
}

app.on('window-all-closed', () => {
  win = null;
});

app.whenReady().then(createWindow).catch(err);

// This is the entry point for the electron main process.
// It uses main/electronSetup to get the first window open.
// It invokes the Startup promise/async function (from main/General)
// initially. It also invokes the Ready function (from main/Ready)
// once the window has registered.

InitBeforeAnythingElse();

StartApp(WindowStartup).catch(err);
