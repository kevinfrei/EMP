import { isUndefined } from '@freik/typechk';
import debug from 'debug';
import { BrowserWindow, shell } from 'electron';
import { promises as fsp } from 'fs';

const err = debug('EMP:main:about');
err.enabled = true;

let aboutWindow: BrowserWindow | undefined;

export function ShowAbout(): void {
  if (isUndefined(aboutWindow)) {
    aboutWindow = new BrowserWindow({
      title: 'About EMP',
      webPreferences: { nodeIntegration: false, contextIsolation: true },
      alwaysOnTop: true,
      center: true,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
      modal: true,
      resizable: false,
      skipTaskbar: true,
      minWidth: 400,
      maxWidth: 400,
      width: 400,
      maxHeight: 250,
      minHeight: 250,
      height: 250,
    })
      .on('ready-to-show', () => {
        if (aboutWindow) {
          aboutWindow.focus();
          aboutWindow.webContents.openDevTools();
        }
      })
      .on('closed', () => {
        aboutWindow = undefined;
      });
    aboutWindow.webContents.on('will-navigate', function (e, url) {
      // If url isn't the actual page
      if (url !== aboutWindow?.webContents.getURL()) {
        e.preventDefault();
        shell.openExternal(url).catch(err);
      }
    });
    aboutWindow.removeMenu();
  }
  lookAround().catch(err);
  aboutWindow.loadURL('about.html').catch(err);
}

async function lookAround() {
  const vals = await fsp.readdir(__dirname);
  for (const val of vals) {
    err(val);
  }
}
