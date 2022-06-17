import { MakeError, Type } from '@freik/core-utils';
import { Comms, Persistence } from '@freik/elect-main-utils';
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
import { CurrentView, Keys } from 'shared';
import { ToggleMiniPlayer } from './window';

const err = MakeError('menu-err'); // eslint-disable-line

type ClickHandler = (
  mnu: MenuItem,
  wnd: BrowserWindow | undefined,
  event: KeyboardEvent,
) => void;

const isMac = process.platform === 'darwin';

// eslint-disable-next-line
const ___: MenuItemConstructorOptions = { type: 'separator' };

function getClick(handler?: ClickHandler | unknown): ClickHandler | undefined {
  if (!handler) {
    return;
  }
  if (Type.isFunction(handler)) {
    return handler as ClickHandler;
  }
  return () => {
    void Comms.AsyncSend({ menuAction: handler });
  };
}

function getId(lbl: string): string {
  return lbl.replaceAll('&', '').replaceAll(' ', '_').toLocaleLowerCase();
}

// TODO: Add an action to be taken, with a quick x-plat shortcut key
function xaction(
  label: string,
  accelerator: string,
  handler?: ClickHandler | unknown,
): MenuItemConstructorOptions {
  return {
    label,
    id: getId(label),
    accelerator: `CmdOrCtrl+${accelerator}`,
    click: getClick(handler),
  };
}

// Typescript Method Overloading is kinda weird...
function action(
  label: string,
  accOrHdlr: string | ClickHandler | unknown | void,
  handler?: ClickHandler | unknown,
): MenuItemConstructorOptions {
  if (Type.isString(accOrHdlr)) {
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
    xaction('T&ools', Keys.Settings, { state: 'view', select: 'Tools' }),
    xaction('Se&ttings', Keys.Tools, { state: 'view', select: 'Settings' }),
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
  void open('https://github.com/kevinfrei/EMP/wiki');
});
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

export function MakeMainMenu(): void {
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
    // eslint-disable-next-line @typescript-eslint/no-for-in-array, guard-for-in
    for (const id in Type.enumKeys(CurrentView)) {
      const mnu = menu.getMenuItemById(CurrentView[id]);
      if (mnu) {
        mnu.enabled = `${id}` !== val;
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
