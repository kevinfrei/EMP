import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { MediaKey } from '@freik/media-core';
import { ipcMain, OpenDialogOptions, shell } from 'electron';
import { IpcMainInvokeEvent } from 'electron/main';
import { getSimpleMusicDatabase, RescanAudioDatase } from './AudioDatabase';
import { isAlbumCoverData, SaveNativeImageForAlbum } from './cover-art';
import { FlushImageCache } from './ImageCache';
import { isOnlyMetadata, setMediaInfoForSong } from './metadata';
import {
  getMediaInfoForSong,
  getPathFromKey,
  searchSubstring,
  searchWholeWord,
} from './MusicAccess';
import { Persistence } from './persist';
import {
  checkPlaylists,
  deletePlaylist,
  getPlaylists,
  isPlaylistSaveData,
  loadPlaylist,
  renamePlaylist,
  savePlaylist,
} from './playlists';
import {
  clearSongHates,
  clearSongLikes,
  getSongHates,
  getSongLikes,
  setSongHates,
  setSongLikes,
} from './SongLikesAndHates';
import { SendToMain, showOpenDialog } from './window';

const log = MakeLogger('Communication');
const err = MakeError('Communication-err');

type Handler<R, T> = (arg: T) => Promise<R | void>;

/**
 * Read a value from persistence by name, returning it's unprocessed contents
 *
 * @async @function
 * @param {string=} name - the name of the value to read
 * @return {Promise<string>} The raw string contents of the value
 */
export async function readFromStorage(name?: string): Promise<string> {
  if (!name) return '';
  try {
    log(`readFromStorage(${name})`);
    const value = await Persistence.getItemAsync(name);
    log(`Sending ${name} response:`);
    log(value);
    return value || '';
  } catch (e) {
    err(`error from readFromStorage(${name})`);
    err(e);
  }
  return '';
}

/**
 * Write a value to persistence by name.
 *
 * @async @function
 * @param {string?} keyValuePair - The key:value string to write
 */
export async function writeToStorage([key, value]: [
  string,
  string,
]): Promise<void> {
  try {
    // First, split off the key name:
    log(`writeToStorage(${key} : ${value})`);
    // Push the data into the persistence system
    await Persistence.setItemAsync(key, value);
    log(`writeToStorage(${key}...) completed`);
  } catch (e) {
    err(`error from writeToStorage([${key}, ${value}])`);
    err(e);
  }
}

/**
 * Registers with `ipcMain.handle` a function that takes a mandatory parameter
 * and returns *string* data untouched. It also requires a checker to ensure the
 * data is properly typed
 * @param  {string} key - The id to register a listener for
 * @param  {TypeHandler<T>} handler - the function that handles the data
 * @param  {(v:any)=>v is T} checker - a Type Check function for type T
 * @returns void
 */
export function registerChannel<R, T>(
  key: string,
  handler: Handler<R, T>,
  checker: (v: any) => v is T,
): void {
  ipcMain.handle(
    key,
    async (event: IpcMainInvokeEvent, arg: any): Promise<R | void> => {
      if (checker(arg)) {
        return await handler(arg);
      } else {
        err(`Invalid argument type to ${key} handler`);
        err(arg);
      }
    },
  );
}

/**
 * Show a file in the shell
 * @param filePath - The path to the file to show
 */
function showFile(filePath?: string): Promise<void> {
  return new Promise((resolve) => {
    if (filePath) {
      shell.showItemInFolder(filePath);
    }
    resolve();
  });
}

/**
 * Show a file in the shell
 * @param filePath - The path to the file to show
 */
function showLocFromKey(mediaKey?: MediaKey): Promise<void> {
  return getPathFromKey(mediaKey).then((filePath) => {
    if (filePath) {
      shell.showItemInFolder(filePath);
    }
  });
}

/**
 * Send a message to the rendering process
 *
 * @param  {unknown} message
 * The (flattenable) message to send.
 */
export function asyncSend(message: unknown): void {
  SendToMain('async-data', { message });
}

function isKeyValue(obj: any): obj is [string, string] {
  return Type.isArray(obj) && obj.length === 2 && Type.isArrayOfString(obj);
}

// I don't actually care about this type :)
function isVoid(obj: any): obj is void {
  return true;
}

function isStrOrUndef(obj: any): obj is string | undefined {
  return Type.isString(obj) || obj === undefined;
}

function isOpenDialogOptions(obj: any): obj is OpenDialogOptions {
  // TODO: Should probably actually check...
  return true;
}

/**
 * Setup any async listeners, plus register all the "invoke" handlers
 */
export function CommsSetup(): void {
  // These are the general "just asking for something to read/written to disk"
  // functions. Media Info, Search, and MusicDB stuff needs a different handler
  // because they don't just read/write to disk.
  registerChannel('read-from-storage', readFromStorage, Type.isString);
  registerChannel('write-to-storage', writeToStorage, isKeyValue);

  // "complex" API's (not just save/restore data to the persist cache)
  registerChannel('get-music-database', getSimpleMusicDatabase, isVoid);
  registerChannel('upload-image', SaveNativeImageForAlbum, isAlbumCoverData);
  registerChannel('media-info', getMediaInfoForSong, Type.isString);
  registerChannel('flush-image-cache', FlushImageCache, isVoid);
  registerChannel('manual-rescan', RescanAudioDatase, isVoid);
  registerChannel('show-file', showFile, Type.isString);
  registerChannel('show-location-from-key', showLocFromKey, Type.isString);
  registerChannel('set-media-info', setMediaInfoForSong, isOnlyMetadata);

  registerChannel('search', searchWholeWord, isStrOrUndef);
  registerChannel('subsearch', searchSubstring, Type.isString);

  registerChannel('load-playlist', loadPlaylist, Type.isString);
  registerChannel('get-playlists', getPlaylists, isVoid);
  registerChannel('set-playlists', checkPlaylists, Type.isArrayOfString);
  registerChannel('rename-playlist', renamePlaylist, isKeyValue);
  registerChannel('save-playlist', savePlaylist, isPlaylistSaveData);
  registerChannel('delete-playlist', deletePlaylist, Type.isString);

  registerChannel('get-likes', getSongLikes, isVoid);
  registerChannel('set-likes', setSongLikes, Type.isArrayOfString);
  registerChannel('clear-likes', clearSongLikes, Type.isArrayOfString);

  registerChannel('get-hates', getSongHates, isVoid);
  registerChannel('set-hates', setSongHates, Type.isArrayOfString);
  registerChannel('clear-hates', clearSongHates, Type.isArrayOfString);

  registerChannel('show-open-dialog', showOpenDialog, isOpenDialogOptions);
}
