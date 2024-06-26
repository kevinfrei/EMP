import { Persistence } from '@freik/electron-main';
import { CurrentView, IpcId, Keys } from '@freik/emp-shared';
import { isFunction, isString } from '@freik/typechk';
import {
  BrowserWindow,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  app,
  shell,
} from 'electron';
import { KeyboardEvent } from 'electron/main';
import { ShowAbout } from './About.js';
import { SendToUI } from './SendToUI.js';
import { ToggleMiniPlayer } from './window.js';

// const { wrn } = MakeLog('EMP:main:menu');

type ClickHandler = (
  mnu: MenuItem,
  wnd: BrowserWindow | undefined,
  event: KeyboardEvent,
) => void;

const isMac = process.platform === 'darwin';

const ___: MenuItemConstructorOptions = { type: 'separator' };

function getClick<T>(handler?: ClickHandler | T): ClickHandler | undefined {
  if (!handler) {
    return;
  }
  if (isFunction(handler)) {
    return handler;
  }
  return () => SendToUI(IpcId.MenuAction, handler);
}

function getId(lbl: string): string {
  return lbl.replaceAll('&', '').replaceAll(' ', '_').toLocaleLowerCase();
}

// TODO: Add an action to be taken, with a quick x-plat shortcut key
function xaction<T>(
  label: string,
  accelerator: string,
  handler?: ClickHandler | T,
): MenuItemConstructorOptions {
  return {
    label,
    id: getId(label),
    accelerator: `CmdOrCtrl+${accelerator}`,
    click: getClick(handler),
  };
}

// Typescript Method Overloading is kinda weird...
function action<T>(
  label: string,
  accOrHdlr: string | ClickHandler | T,
  handler?: ClickHandler | T,
): MenuItemConstructorOptions {
  if (isString(accOrHdlr)) {
    return {
      label,
      id: getId(label),
      accelerator: `CmdOrCtrl+${accOrHdlr}`,
      click: getClick(handler),
    };
  } else if (!accOrHdlr) {
    return { label, id: getId(label) };
  } else {
    return { label, id: getId(label), click: getClick(accOrHdlr) };
  }
}

const appMenu: MenuItemConstructorOptions = {
  role: 'appMenu',
  label: app.name,
  submenu: [
    action('About EMP', ShowAbout),
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
    xaction('Add F&ile Location', Keys.AddFileLocation, {
      state: 'addLocation',
    }),
    ___,
    xaction('&Save Playlist', Keys.SavePlaylist, { state: 'savePlaylist' }),
    // xaction('Save Playlist &As', 'Shift+S', { state: 'savePlaylistAs' }),
    ___,
    { role: isMac ? 'close' : 'quit' },
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
    xaction('F&ind', Keys.Find, { state: 'find' }),
  ],
};
const viewMenu: MenuItemConstructorOptions = {
  label: '&View',
  submenu: [
    xaction('&Now Playing', Keys.NowPlaying, {
      state: 'view',
      select: 'NowPlaying',
    }),
    ___,
    xaction('A&lbums', Keys.Albums, { state: 'view', select: 'Albums' }),
    xaction('A&rtists', Keys.Artists, { state: 'view', select: 'Artists' }),
    xaction('&Songs', Keys.Songs, { state: 'view', select: 'Songs' }),
    xaction('&Playlists', Keys.Playlists, {
      state: 'view',
      select: 'Playlists',
    }),
    xaction('T&ools', Keys.Tools, { state: 'view', select: 'Tools' }),
    xaction('Se&ttings', Keys.Settings, { state: 'view', select: 'Settings' }),
    ___,
    xaction('Toggle M&ini Player', Keys.ToggleMiniPlayer, ToggleMiniPlayer),
  ],
};
const mediaMenu: MenuItemConstructorOptions = {
  label: '&Media',
  submenu: [
    xaction('Pla&y', Keys.Play, { state: 'playback' }),
    xaction('Pre&vious Track', Keys.PreviousTrack, { state: 'prevTrack' }),
    xaction('Ne&xt Track', Keys.NextTrack, { state: 'nextTrack' }),
    ___,
    xaction('Skip &Forward 10s', Keys.Forward10s, { state: 'fwd' }),
    xaction('Skip &Back 10s', Keys.Backward10s, { state: 'back' }),
    ___,
    {
      ...xaction('&Shuffle', Keys.Shuffle, { state: 'shuffle' }),
      type: 'checkbox',
    },
    {
      ...xaction('&Repeat', Keys.Repeat, { state: 'repeat' }),
      type: 'checkbox',
    },
    ___,
    action('&Mute', { state: 'mute' }),
    action('Volume &Up', { state: 'louder' }),
    action('Volume &Down', { state: 'quieter' }),
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
const helpItem: MenuItemConstructorOptions = action(`${app.name} help`, () => {
  void shell.openExternal('https://github.com/kevinfrei/EMP/wiki');
});
const helpMenu: MenuItemConstructorOptions = {
  //    role: 'help',
  label: '&Help',
  submenu: isMac ? [helpItem] : [helpItem, ___, action('About EMP', ShowAbout)],
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

export function MakeMainMenu(): void {
  if (!isMac) {
    // Rip off the appMenu for non-Mac
    template.shift();
  }
  if (!app.isPackaged) {
    // Add the debug menu for dev-mode
    template.push(dbgMenu);
  }
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // TODO: Get the initial state working

  // This is the world's slowest way to respond to state changes :D
  Persistence.subscribe('repeat', (val: string) => {
    const itm = menu.getMenuItemById('repeat');
    if (itm) {
      itm.checked = val === 'true';
    }
  });
  Persistence.subscribe('shuffle', (val: string) => {
    const itm = menu.getMenuItemById('shuffle');
    if (itm) {
      itm.checked = val === 'true';
    }
  });
  Persistence.subscribe('CurrentView', (val: string) => {
    let id: keyof typeof CurrentView;

    for (id in CurrentView) {
      const item = CurrentView[id];
      const mnu = menu.getMenuItemById(id);
      if (mnu) {
        mnu.enabled = `${item}` !== val;
      }
    }
  });

  // Toggle mute/adjust vol up/dn
  Persistence.subscribe('volume', (val: string) => {
    const vol = Number.parseFloat(val);
    const up = menu.getMenuItemById('volume_up');
    const dn = menu.getMenuItemById('volume_down');
    if (up && dn) {
      up.enabled = vol < 1.0;
      dn.enabled = vol > 0.0;
    }
  });
  Persistence.subscribe('mute', (val: string) => {
    const itm = menu.getMenuItemById('mute');
    if (itm) {
      itm.label = val === 'true' ? 'Unm&ute' : 'M&ute';
    }
  });
}
