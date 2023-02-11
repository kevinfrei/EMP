// This is for getting at "global" stuff from the window object
import { MakeError, MakeLogger, Type } from '@freik/core-utils';

const log = MakeLogger('MyWindow-mock');
const err = MakeError('MyWindow-mock-err');

export async function ShowOpenDialog(): Promise<string[] | void> {
  /* options: OpenDialogSyncOptions, */
  return Promise.resolve([]);
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
]);

function MockWrite(key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fakeStorage.set(key, value);
    err('Saved!');
    err(key);
    resolve();
  });
}

function MockRead(key: string): Promise<string> {
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

export async function InvokeMain<T>(
  channel: string,
  key?: T,
): Promise<string | void> {
  switch (channel) {
    case 'read-from-storage':
      if (Type.isString(key)) {
        return await MockRead(key);
      }
      break;
    case 'write-to-storage':
      if (Type.is2TupleOf(key, Type.isString, Type.isString)) {
        const [k, v] = key;
        return await MockWrite(k, v);
      }
      break;
  }
  err(`Unabled to deal with '${channel}' for testing`);
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
  err(
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
  return await CallMain('read-from-storage', key, Type.isString);
}

export async function WriteToStorage(key: string, data: string): Promise<void> {
  await InvokeMain('write-to-storage', [key, data]);
}
