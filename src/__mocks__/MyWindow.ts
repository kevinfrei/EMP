// This is for getting at "global" stuff from the window object
import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { OpenDialogSyncOptions } from 'electron/main';

const log = MakeLogger('MyWindow-mock');
const err = MakeError('MyWindow-mock-err');

export function ShowOpenDialog(
  options: OpenDialogSyncOptions,
): string[] | undefined {
  return [];
}

export function SetInit(func: () => void): void {
  //  realSetInit(func);
}

export function InitialWireUp(): void {
  //  realInitialWireUp();
}

export function SubscribeMediaMatcher(
  mq: string,
  handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
): void {
  /* Don't do anything for now */
}

export function UnsubscribeMediaMatcher(
  handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
): void {
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
]);

function MockWrite(key?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!key) {
      reject('No key provided');
      return;
    }
    const split = key.indexOf(':');
    if (split < 0) {
      reject('Invalid string to save to storage');
      return;
    }
    const item = key.substr(0, split);
    const value = key.substr(split + 1);
    fakeStorage.set(item, value);
    err('Saved!');
    err(key);
    resolve();
  });
}

function MockRead(key?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (Type.isString(key)) {
      log(`Reading '${key}' from Mock`);
      const res = fakeStorage.get(key);
      log(`Next Tick: Reading ${key ? key : '?unk?'}: ${res ? res : '?und?'}`);
      if (Type.isString(res)) {
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

export async function InvokeMain(
  channel: string,
  key?: string,
): Promise<string | void> {
  switch (channel) {
    case 'read-from-storage':
      return await MockRead(key);
    case 'write-to-storage':
      return await MockWrite(key);
  }
}
