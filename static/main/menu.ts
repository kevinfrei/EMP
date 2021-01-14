import { FTONObject, MakeError, MakeLogger, Type } from '@freik/core-utils';
import {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
} from 'electron';
import isDev from 'electron-is-dev';
import { KeyboardEvent } from 'electron/main';
import open from 'open';
import { asyncSend } from './Communication';

const log = MakeLogger('menu', true);
const err = MakeError('menu-err'); // eslint-disable-line

type ClickHandler = (
  mnu?: MenuItem,
  wnd?: BrowserWindow | undefined,
  event?: KeyboardEvent,
) => void;

const isMac = process.platform === 'darwin';

// eslint-disable-next-line
const ___: MenuItemConstructorOptions = { type: 'separator' };

function getClick(handler?: ClickHandler | FTONObject) {
  if (!handler) {
    return;
  }
  if (Type.isFunction(handler)) {
    return handler;
  }
  return () => void asyncSend({ menuAction: handler });
}

// TODO: Add an action to be taken, with a quick x-plat shortcut key
function xaction(
  label: string,
  accelerator: string,
  handler?: ClickHandler | FTONObject,
): MenuItemConstructorOptions {
  return {
    label,
    accelerator: `CmdOrCtrl+${accelerator}`,
    click: getClick(handler),
  };
}

// Typescript Method Overloading is kinda weird...
function action(
  label: string,
  handler?: ClickHandler | FTONObject,
): MenuItemConstructorOptions;
function action(
  label: string,
  accelerator: string,
  handler?: ClickHandler | FTONObject,
): MenuItemConstructorOptions;
function action(
  label: string,
  accOrHdlr: string | ClickHandler | FTONObject | void,
  handler?: ClickHandler | FTONObject,
): MenuItemConstructorOptions {
  if (Type.isString(accOrHdlr)) {
    return { label, accelerator: accOrHdlr, click: getClick(handler) };
  } else if (!accOrHdlr) {
    return { label };
  } else {
    return { label, click: getClick(handler) };
  }
}

export function makeMainMenu(): void {
  const appMenu: MenuItemConstructorOptions = {
    role: 'appMenu',
    label: app.name,
    submenu: [
      { role: 'about' },
      ___,
      { role: 'services' },
      ___,
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      ___,
      { role: 'quit' },
    ],
  };

  const fileMenu: MenuItemConstructorOptions = {
    role: 'fileMenu',
    label: '&File',
    submenu: [
      xaction('Add F&ile Location', 'O', { state: 'addLocation' }),
      ___,
      isMac ? { role: 'close' } : { role: 'quit' },
    ],
  };

  const editMenu: MenuItemConstructorOptions = {
    role: 'editMenu',
    label: '&Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      ___,
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
      ___,
      xaction('F&ind', 'F', { state: 'find' }),
    ],
  };
  const viewMenu: MenuItemConstructorOptions = {
    role: 'viewMenu',
    label: '&View',
    submenu: [
      xaction('&Now Playing', '1', { state: 'view', select: 'NowPlaying' }),
      xaction('A&lbums', '2', { state: 'view', select: 'Albums' }),
      xaction('A&rtists', '3', { state: 'view', select: 'Artists' }),
      xaction('&Songs', '4', { state: 'view', select: 'Songs' }),
      xaction('&Playlists', '5', { state: 'view', select: 'Playlists' }),
      xaction('Se&ttings', ',', { state: 'view', select: 'Settings' }),
      ___,
      xaction('M&iniPlayer', '0', { state: 'MiniPlayer' }),
    ],
  };
  // TODO: Make this stuff all work :D
  const mediaMenu: MenuItemConstructorOptions = {
    label: '&Media',
    submenu: [
      xaction('Pla&y', 'P', { state: 'playback' }),
      xaction('Pre&vious Track', 'Left', { state: 'prevTrack' }),
      xaction('Ne&xt Track', 'Right', { state: 'nextTrack' }),
      ___,
      xaction('Skip &Forward 10s', 'Down', { state: 'fwd' }),
      xaction('Skip &Back 10s', 'Up', { state: 'back' }),
      ___,
      {
        ...xaction('Toggle &Shuffle', 'S', { state: 'shuffle' }),
        type: 'checkbox',
      },
      {
        ...xaction('Toggle &Repeat', 'T', { state: 'repeat' }),
        type: 'checkbox',
      },
      ___,
      xaction('&Mute', 'VolumeMute', { state: 'mute' }),
      xaction('Volume &Up', 'VolumeUp', { state: 'louder' }),
      xaction('Volume &Down', 'VolumeDown', { state: 'quieter' }),
    ],
  };
  const windowMenu: MenuItemConstructorOptions = {
    role: 'windowMenu',
    label: '&Window',
    submenu: isMac
      ? [
          { role: 'minimize' },
          { role: 'zoom' },
          ___,
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          ___,
          { role: 'togglefullscreen' },
          ___,
          { role: 'front' },
        ]
      : [
          { role: 'minimize' },
          { role: 'zoom' },
          ___,
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          ___,
          { role: 'togglefullscreen' },
        ],
  };
  const helpItem: MenuItemConstructorOptions = action(
    `${app.name} help`,
    () => {
      log('HERE!');
      void open('https://github.com/kevinfrei/EMP/wiki');
    },
  );
  const helpMenu: MenuItemConstructorOptions = {
    //    role: 'help',
    label: '&Help',
    submenu: isMac ? [helpItem] : [helpItem, ___, { role: 'about' }],
  };
  const dbgMenu: MenuItemConstructorOptions = {
    label: '&Debug',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
    ],
  };

  const template: MenuItemConstructorOptions[] = [
    appMenu,
    fileMenu,
    editMenu,
    viewMenu,
    mediaMenu,
    windowMenu,
    helpMenu,
  ];
  if (!isMac) {
    // Rip off the appMenu for non-Mac
    template.shift();
  }
  if (isDev) {
    // Add the debug menu for dev-mode
    template.push(dbgMenu);
  }
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
