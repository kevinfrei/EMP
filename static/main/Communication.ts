import { BrowserWindow, ipcMain } from 'electron';
import { FTON, FTONData, Logger } from '@freik/core-utils';

import * as persist from './persist';
import {
  getAllAlbums,
  getAllArtists,
  getAllPlaylists,
  getAllSongs,
  getMediaInfoForSong,
} from './MusicAccess';
import { IpcMainInvokeEvent } from 'electron/main';

const log = Logger.bind('Communication');
Logger.enable('Communication');

/*
function getWebContents() {
  const allWnd: BrowserWindow[] = BrowserWindow.getAllWindows();
  if (allWnd.length < 1) {
    log('No browser windows found in get operation.');
    return;
  }
  return allWnd[0].webContents;
}
*/

type Handler<T> = (arg?: string) => Promise<T | void>;

async function getGeneral(name?: string) {
  if (!name) return;
  try {
    log(`getGeneral(${name})`);
    const value = await persist.getItemAsync(name);
    log(`Sending ${name} response:`);
    log(value);
    return value;
  } catch (e) {
    log(`error from getGeneral(${name})`);
    log(e);
  }
  return 'error';
}

async function setGeneral(keyValuePair?: string) {
  if (!keyValuePair) return;
  try {
    // First, split off the key name:
    const pos = keyValuePair.indexOf(':');
    const name = keyValuePair.substring(0, pos);
    const value = keyValuePair.substring(pos + 1);
    log(`setGeneral(${name} : ${value})`);
    // Push the data into the persistence system
    await persist.setItemAsync(name, value);
    log(`setGeneral(${name}...) completed`);
  } catch (e) {
    log(`error from getGeneral(${keyValuePair})`);
    log(e);
  }
}

function registerFlattened<T>(key: string, handleIt: Handler<T>) {
  ipcMain.handle(
    key,
    async (event: IpcMainInvokeEvent, arg?: any): Promise<string | void> => {
      if (typeof arg === 'string' || !arg) {
        const res = await handleIt(arg);
        if (res) {
          return FTON.stringify((res as unknown) as FTONData);
        }
      } else {
        log(`Bad (flattened) type for argument to ${key}: ${typeof arg}`);
      }
    },
  );
}

function register(key: string, handleIt: Handler<string>) {
  ipcMain.handle(
    key,
    async (event: IpcMainInvokeEvent, arg: any): Promise<string | void> => {
      if (typeof arg === 'string') {
        return await handleIt(arg);
      } else {
        log(`Bad (flattened) type for argument to ${key}: ${typeof arg}`);
      }
    },
  );
}

// Called to just set stuff up (nothing has actually been done yet)
export function Init(): void {
  // I like this API much better, particularly in the render process
  registerFlattened('get-all-songs', getAllSongs);
  registerFlattened('get-all-albums', getAllAlbums);
  registerFlattened('get-all-artists', getAllArtists);
  registerFlattened('get-all-playlists', getAllPlaylists);
  registerFlattened('get-media-info', getMediaInfoForSong);
  register('get-general', getGeneral);
  register('set-general', setGeneral);
}

// Called with the window handle after it's been created
export function Begin(window: BrowserWindow): void {
  // win = window;
}
