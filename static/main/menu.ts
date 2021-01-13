import { app, Menu, MenuItemConstructorOptions } from 'electron';
import isDev from 'electron-is-dev';

const isMac = process.platform === 'darwin';
// eslint-disable-next-line
const ___: MenuItemConstructorOptions = { type: 'separator' };

// TODO: Add an action to be taken, with a quick x-plat shortcut key
function xaction(
  label: string,
  accelerator: string,
  handler?: () => Promise<void>,
): MenuItemConstructorOptions {
  if (accelerator) {
    return { label, accelerator: `CmdOrCtrl+${accelerator}`, click: handler };
  }
  return { label, click: handler };
}

function action(
  label: string,
  accelerator?: string,
  handler?: () => Promise<void>,
): MenuItemConstructorOptions {
  return { label, accelerator, click: handler };
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
      action('Pla&y', 'MediaPlayPause'),
      action('Pre&vious Track', 'MediaPreviousTrack'),
      action('Ne&xt Track', 'MediaNextTrack'),
      ___,
      { ...xaction('Toggle &Shuffle', 'S'), type: 'checkbox' },
      { ...xaction('Toggler &Repeat', 'R'), type: 'checkbox' },
      ___,
      action('&Mute', 'VolumeMute'),
      action('Volume &Up', 'VolumeUp'),
      action('Volume &Down', 'VolumeDown'),
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
  const helpItem: MenuItemConstructorOptions = action(`${app.name} help`);
  const helpMenu: MenuItemConstructorOptions = {
    role: 'help',
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
