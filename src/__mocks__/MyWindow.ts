// This is for getting at "global" stuff from the window object
import { ISearchBox } from '@fluentui/react';
import { FlatAudioDatabase } from '@freik/audiodb';
import { ElectronWindow } from '@freik/electron-render';
import { MakeLog } from '@freik/logger';
import { is2TupleOf, isString } from '@freik/typechk';
import { IpcRenderer } from 'electron';
import { IpcId } from '@freik/emp-shared';

const { log, wrn } = MakeLog('EMP:render:MyWindow-mock');

interface MyWindow extends ElectronWindow {
  searchBox?: ISearchBox | null;
  db: FlatAudioDatabase;
}

declare let window: MyWindow;

export async function ShowOpenDialog(): Promise<string[] | void> {
  /* options: OpenDialogSyncOptions, */
  return Promise.resolve([]);
}

export function SetDB(db: FlatAudioDatabase): void {
  window.db = db;
}

export function SetInit(/* func: () => void */): void {
  //  realSetInit(func);
}

export function InitialWireUp(): void {
  //  realInitialWireUp();
}

// eslint-disable-next-line
export function SetSearch(srch: any): void {
  // Do nothing
}

export function SubscribeMediaMatcher(): void {
  /*
  mq: string,
  handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
  */
  /* Don't do anything for now */
}

export function UnsubscribeMediaMatcher(): void {
  // handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
  /* Still don't do anything */
}
/*
  // "complex" API's (not just save/restore data to the persist cache)
  registerFlattened('get-media-info', getMediaInfoForSong);
  registerFlattened('search', searchWholeWord);
  registerFlattened('subsearch', searchSubstring);
  registerFlattened('show-file', showFile);
  registerFlattened('rename-playlist', renamePlaylist);
  registerFlattened('delete-playlist', deletePlaylist);
  registerFlattened('get-playlists', getPlaylists);
  registerFlattened('save-playlist', savePlaylist);
  registerFlattened('load-playlist', loadPlaylist);
  registerFlattened('set-playlists', checkPlaylists);

  // Some "do something, please" API's
  register('set-media-info', setMediaInfoForSong);
  registerFlattened('manual-rescan', RescanDB);
  registerFlattened('flush-image-cache', FlushImageCache);

  // These are the general "just asking for something to read/written to disk"
  // functions. Media Info, Search, and MusicDB stuff needs a different handler
  // because they don't just read/write to disk.
  register('read-from-storage', readFromStorage);
  register('write-to-storage', writeToStorage);
*/

const fakeStorage: Map<string, string> = new Map<string, string>([
  ['CurrentView', '1'],
  ['mute', 'false'],
  ['volume', '0.12'],
  ['shuffle', 'false'],
  ['repeat', 'false'],
  ['locations', '["/Users/freik/Music/iTunes/iTunes Media/Music"]'],
  ['rSortWithArticles', 'false'],
  ['FullAlbumsOnly', 'true'],
  ['MinSongCount', '1'],
  ['downloadAlbumArtwork', 'true'],
  ['downloadArtistArtwork', 'true'],
  ['saveAlbumArtworkWithMusic', 'true'],
  ['albumCoverName', '".coverArt"'],
  ['defaultLocation', ''],
  ['onlyPlayLikes', 'false'],
  ['neverPlayHates', 'true'],
  ['likedSongs', '[]'],
  ['hatedSongs', '[]'],
  ['currentSongList', '[]'],
  ['currentIndex', '-1'],
]);

function MockWrite(key: string, value: string): Promise<void> {
  return new Promise((resolve) => {
    fakeStorage.set(key, value);
    wrn('Saved!');
    wrn(key);
    resolve();
  });
}

function MockRead(key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isString(key)) {
      log(`Reading '${key}' from Mock`);
      const res = fakeStorage.get(key);
      log(`Next Tick: Reading ${key ? key : '?unk?'}: ${res ? res : '?und?'}`);
      if (isString(res)) {
        log('Resolving!');
        resolve(res);
      }
      reject({ error: `Key "${key}" not found in mock storage` });
    } else {
      reject({
        error: 'read-from-storage without a key value',
      });
    }
  });
  /*  process.nextTick(() => {
      if (Type.isString(key)) {
        const res = fakeStorage.get(key);
        err(
          `Next Tick: Reading ${key ? key : '?unk?'}: ${res ? res : '?und?'}`,
        );
        if (Type.isString(res)) {
          err('Resolving!');
          resolve(res);
        }
        reject({ error: `Key "${key}" not found in mock storage` });
      } else {
        reject({
          error: 'read-from-storage without a key value',
        });
      }
    });
  });*/
}

export async function InvokeMain<T>(
  channel: string,
  key?: T,
): Promise<unknown | void> {
  switch (channel) {
    case 'read-from-storage':
      if (isString(key)) {
        return await MockRead(key);
      }
      break;
    case 'write-to-storage':
      if (is2TupleOf(key, isString, isString)) {
        const [k, v] = key;
        return await MockWrite(k, v);
      }
      break;
    case IpcId.GetMusicDatabase:
      return { songs: [], artists: [], albums: [] };
    case IpcId.GetIgnoreList:
      return [];
    case IpcId.Search:
      return { songs: [], artists: [], albums: [] };
    case IpcId.GetPicUri:
      // The google image:
      return 'https://play-lh.googleusercontent.com/1-hPxafOxdYpYZEOKzNIkSP43HXCNftVJVttoo4ucl7rsMASXW3Xr6GlXURCubE1tA=w7680-h4320-rw';
  }
  wrn(`Unabled to deal with '${channel}' for testing. Key:`);
  wrn(key);
}

export async function CallMain<R, T>(
  channel: string,
  key: T,
  typecheck: (val: unknown) => val is R,
): Promise<R | void> {
  const result = await InvokeMain(channel, key);
  if (typecheck(result)) {
    return result;
  }
  wrn(
    `CallMain(${channel}, <T>, ${typecheck.name}(...)) result failed typecheck`,
    result,
  );
}

export async function PostMain<T>(channel: string, key?: T): Promise<void> {
  return CallMain(channel, key, (a: unknown): a is void => true);
}

export function isHostMac(): boolean {
  return true;
}

export function isHostLinux(): boolean {
  return false;
}

export function isHostWindows(): boolean {
  return false;
}

export async function ReadFromStorage(key: string): Promise<string | void> {
  return await CallMain('read-from-storage', key, isString);
}

export async function WriteToStorage(key: string, data: string): Promise<void> {
  await InvokeMain('write-to-storage', [key, data]);
}

export function MockERU() {
  window.electronConnector = {
    hostOs: ((): 'mac' | 'win' | 'lin' | 'unk' => {
      const plat = process.platform;
      switch (plat) {
        case 'darwin':
          return 'mac';
        case 'win32':
          return 'win';
        case 'linux':
          return 'lin';
        default:
          return 'unk';
      }
    })(),
    ipc: {
      async invoke<T>(channel: string, key?: T) {
        return await InvokeMain(channel, key);
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types
      on(key: string, listen: Function) {
        // Probably should do something here, right?
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types
      removeEventListener(key: string, listen: Function) {
        // Maybe do something here, too?
      },
    } as unknown as IpcRenderer,
    clipboard: {
      // TODO: Fix this up, too, right?
    } as unknown as Electron.Clipboard,
  };
}
