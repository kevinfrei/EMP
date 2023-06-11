import { isUndefined } from '@freik/typechk';
import debug from 'debug';
import { BrowserWindow, shell } from 'electron';
import isDev from 'electron-is-dev';

const err = debug('EMP:main:about');

let aboutWindow: BrowserWindow | undefined;

export function ShowAbout(): void {
  if (isUndefined(aboutWindow)) {
    aboutWindow = new BrowserWindow({
      title: 'About EMP',
      webPreferences: { nodeIntegration: false, contextIsolation: true },
      show: false,
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
          aboutWindow.show();
          aboutWindow.focus();
        }
      })
      .on('closed', () => {
        aboutWindow = undefined;
      });
    aboutWindow.webContents.on('will-navigate', function (e, url) {
      /* If url isn't the actual page */
      if (url !== aboutWindow?.webContents.getURL()) {
        e.preventDefault();
        shell.openExternal(url).catch(err);
      }
    });
    aboutWindow.removeMenu();
  }
  aboutWindow
    .loadURL(
      isDev
        ? 'http://localhost:3000/about.html'
        : `file://${__dirname}/../about.html`,
    )
    .catch(err);
}
