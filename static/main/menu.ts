import { MakeError, MakeLogger, Type } from '@freik/core-utils';
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

// TODO: Add an action to be taken, with a quick x-plat shortcut key
function xaction(
  label: string,
  accelerator: string,
  handler?: ClickHandler,
): MenuItemConstructorOptions {
  if (accelerator) {
    return { label, accelerator: `CmdOrCtrl+${accelerator}`, click: handler };
  }
  return { label, click: handler };
}

// Typescript Method Overloading is kinda weird...
function action(
  label: string,
  handler?: ClickHandler,
): MenuItemConstructorOptions;
function action(
  label: string,
  accelerator: string,
  handler?: ClickHandler,
): MenuItemConstructorOptions;
function action(
  label: string,
  accOrHdlr: string | ClickHandler | void,
  handler?: ClickHandler,
): MenuItemConstructorOptions {
  if (Type.isString(accOrHdlr)) {
    return { label, accelerator: accOrHdlr, click: handler };
  } else if (!accOrHdlr) {
    log('in here...');
    return { label };
  } else {
    log('Right here...');
    return { label, click: handler };
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
      xaction('Add F&ile Location', 'O'),
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
      xaction('F&ind', 'F'),
    ],
  };
  const viewMenu: MenuItemConstructorOptions = {
    role: 'viewMenu',
    label: '&View',
    submenu: [
      xaction('&Now Playing', '1'),
      xaction('A&rtists', '2'),
      xaction('A&lbums', '3'),
      xaction('&Songs', '4'),
      xaction('&Playlists', '5'),
      xaction('Se&ttings', ','),
      ___,
      xaction('M&iniPlayer', '0'),
    ],
  };
  // TODO: Make this stuff all work :D
  const mediaMenu: MenuItemConstructorOptions = {
    label: '&Media',
    submenu: [
      xaction('Pla&y', 'P', () => log('howdy')),
      xaction('Pre&vious Track', 'Left'),
      xaction('Ne&xt Track', 'Right'),
      ___,
      xaction('Skip &Forward 10s', 'Down'),
      xaction('Skip &Back 10s', 'Up'),
      ___,
      { ...xaction('Toggle &Shuffle', 'S'), type: 'checkbox' },
      { ...xaction('Toggle &Repeat', 'T'), type: 'checkbox' },
      ___,
      xaction('&Mute', 'VolumeMute'),
      xaction('Volume &Up', 'VolumeUp'),
      xaction('Volume &Down', 'VolumeDown'),
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
