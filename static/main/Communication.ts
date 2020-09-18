import { ipcMain, BrowserWindow } from 'electron';
import { ipcMain as betterIpc } from '@freik/electron-better-ipc';
import { Logger, FTON, FTONData } from '@freik/core-utils';

import * as persist from './persist';
import {
  getAllAlbums,
  getAllArtists,
  getAllPlaylists,
  getAllSongs,
  getMediaInfoForSong,
} from './MusicAccess';

import type { TrieNode } from './search';

const log = Logger.bind('Communication');
// Logger.enable('Communication');

export type MessageHandler<T> = {
  command: string;
  validator: (val: string) => T | void;
  handler: (data: T) => void;
};

export type KVP<T> = {
  key: string;
  value: T;
};

const indices = new Map<string, Map<string, TrieNode<unknown>>>();

let win: BrowserWindow | null = null;

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

function kvpValidator<T>(val: any): KVP<T> | void {
  if (
    typeof val === 'object' &&
    val !== null &&
    'value' in val &&
    'key' in val &&
    typeof val.key === 'string' // eslint-disable-line
  ) {
    return { key: val.key, value: val.value as T }; // eslint-disable-line
  }
}

function kvpFromJSONValidator(val: string): KVP<FTONData> | void {
  try {
    return kvpValidator(FTON.parse(val));
  } catch (e) {
    log(e);
  }
  return;
}

function stringValidator(val: string): string | void {
  return val;
}

function setter({ key, value }: KVP<unknown>) {
  log(`Persisting '${key}' to:`);
  if (key.toLowerCase() !== 'db') log(value);
  else log('{music database...}');
  persist.setItem(key, FTON.stringify(FTON.typecheck(value)));
}

function deleter(key: string) {
  persist.deleteItem(key);
}

// Get a value from disk and sends {key:'key', value: ...value} in JSON
function getter(key: string) {
  if (!win) {
    setTimeout(() => getter(key), 10);
    return;
  }
  try {
    const val = persist.getItem(key);
    if (typeof val !== 'string') {
      log(`getting ${key} results in non-string value:`);
      log(val);
      return;
    }
    // TODO: This needs updated if/when I add more windows...
    log(`About to send {key:${key}, value:${val}}`);
    const value = FTON.parse(val);
    const message = FTON.stringify({ key, value });
    log(`Sending data: ${message}`);
    win.webContents.send('data', message);
  } catch (e) {
    log('Swallowed exception during get operation:');
    log(e);
  }
}

function mk<T>(
  command: string,
  validator: (val: string) => T | void,
  handler: (data: T) => void,
): MessageHandler<T> {
  return { command, validator, handler };
}

export function SetIndex(
  id: string,
  index: Map<string, TrieNode<unknown>>,
): void {
  indices.set(id, index);
}

async function getGeneral(name: string) {
  try {
    log(`getGeneral(${name})`);
    if (name.startsWith('sync_')) {
      name = name.substr(5);
    }
    const value = await persist.getItemAsync(name);
    log(`Sending value ${name}:`);
    log(value);
    return value;
  } catch (e) {
    log(`error from getGeneral(${name})`);
    log(e);
  }
  return 'error';
}

async function setGeneral(keyValuePair: string) {
  try {
    const pos = keyValuePair.indexOf(':');
    let name = keyValuePair.substring(0, pos);
    const value = keyValuePair.substring(pos + 1);
    if (name.startsWith('sync_')) {
      name = name.substr(5);
    }
    log(`setGeneral(${name} : ${value})`);
    await persist.setItemAsync(name, value);
  } catch (e) {
    log(`error from getGeneral(${keyValuePair})`);
    log(e);
  }
}
// Called to just set stuff up (nothing has actually been done yet)
export function Init(): void {
  // Stuff from the pre-recoil days
  const comms = [
    mk<KVP<FTONData>>('set', kvpFromJSONValidator, setter),
    mk<string>('delete', stringValidator, deleter),
    mk<string>('get', stringValidator, getter),
  ];
  for (const val of comms) {
    ipcMain.on(val.command, (event, arg: string) => {
      const data: string | KVP<FTONData> | void = val.validator(arg);
      if (data || typeof data === 'string') {
        log(`Got data for "${val.command}":`);
        log(data);
        val.handler(data as any);
      } else {
        log(`data validation failure while checking ${val.command}`);
        log(arg);
      }
    });
  }

  // I like this API much better, particularly in the render process
  betterIpc.answerRenderer('get-all-songs', getAllSongs);
  betterIpc.answerRenderer('get-all-albums', getAllAlbums);
  betterIpc.answerRenderer('get-all-artists', getAllArtists);
  betterIpc.answerRenderer('get-all-playlists', getAllPlaylists);
  betterIpc.answerRenderer('get-media-info', getMediaInfoForSong);
  betterIpc.answerRenderer('get-general', getGeneral);
  betterIpc.answerRenderer('set-general', setGeneral);
}

// Called with the window handle after it's been created
export function Begin(window: BrowserWindow): void {
  win = window;
}
