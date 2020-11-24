import { FTON, FTONData, MakeError, MakeLogger } from '@freik/core-utils';
import { ipcMain, shell } from 'electron';
import { IpcMainInvokeEvent } from 'electron/main';
import { FlushImageCache } from './cover-art';
import { setMediaInfoForSong } from './metadata';
import {
  getMediaInfoForSong,
  searchSubstring,
  searchWholeWord,
} from './MusicAccess';
import { RescanDB } from './musicDB';
import * as persist from './persist';
import {
  deletePlaylist,
  getPlaylists,
  loadPlaylist,
  renamePlaylist,
  savePlaylist,
} from './playlists';
import { SendToMain } from './window';

const log = MakeLogger('Communication');
const err = MakeError('Communication-err');

type Handler<T> = (arg?: string) => Promise<T | void>;

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
    const value = await persist.getItemAsync(name);
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
export async function writeToStorage(keyValuePair?: string): Promise<void> {
  if (!keyValuePair) return;
  try {
    // First, split off the key name:
    const pos = keyValuePair.indexOf(':');
    const name = keyValuePair.substring(0, pos);
    const value = keyValuePair.substring(pos + 1);
    log(`writeToStorage(${name} : ${value})`);
    // Push the data into the persistence system
    await persist.setItemAsync(name, value);
    log(`writeToStorage(${name}...) completed`);
  } catch (e) {
    err(`error from writeToStorage(${keyValuePair})`);
    err(e);
  }
}

/**
 * Registers with `ipcMain.handle` a function that takes an optional string
 * (from the query) and returns UNFLATTENED data, which will then be returned
 * using the Flat Type Object Notation stingifier
 *
 * @function
 * @param {string} key - the name of the "channel" to respond to
 * @param {Handler<T>} handleIt - the function that takes a string and returns
 *  the corresponding object value for the channel
 * @returns {void}
 */
export function registerFlattened<T>(key: string, handleIt: Handler<T>): void {
  ipcMain.handle(
    key,
    async (event: IpcMainInvokeEvent, arg?: any): Promise<string | void> => {
      if (typeof arg === 'string' || !arg) {
        log('arg: ');
        log(arg);
        const res = await handleIt(arg);
        log(res);
        if (res) {
          return FTON.stringify((res as unknown) as FTONData);
        }
      } else {
        err(`Bad (flattened) type for argument to ${key}: ${typeof arg}`);
      }
    },
  );
}

/**
 * Registers with `ipcMain.handle` a function that takes an optional string
 * (from the query) and returns *string* data, which is returned, untouched
 *
 * @function
 * @param {string} key - the name of the "channel" to respond to
 * @param {Handler<string>} handleIt - the function that takes a string and
 *   returns a string
 * @returns void
 */
export function register(key: string, handleIt: Handler<string>): void {
  ipcMain.handle(
    key,
    async (event: IpcMainInvokeEvent, arg: any): Promise<string | void> => {
      if (typeof arg === 'string') {
        return await handleIt(arg);
      } else {
        err(`Bad (flattened) type for argument to ${key}: ${typeof arg}`);
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
 * Send a message to the rendering process
 *
 * @param  {FTONData} message
 * The (flattenable) message to send.
 */
export function asyncSend(message: FTONData): void {
  SendToMain('async-data', { message });
}

/**
 * Setup any async listeners, plus register all the "invoke" handlers
 */
export function CommsSetup(): void {
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

  // Some "do something, please" API's
  register('update-metadata', setMediaInfoForSong);
  register('manual-rescan', RescanDB);
  register('flush-image-cache', FlushImageCache);

  // These are the general "just asking for something to read/written to disk"
  // functions. Media Info, Search, and MusicDB stuff needs a different handler
  // because they don't just read/write to disk.
  register('read-from-storage', readFromStorage);
  register('write-to-storage', writeToStorage);
}
