import { ipcMain, BrowserWindow } from 'electron';
import promiseIpc from 'electron-promise-ipc';
import { logger } from '@freik/simplelogger';
import { FTON, FTONData } from '@freik/core-utils';

import * as persist from './persist';
import { getMediaInfo } from './music';

// import type { FTONData } from '@freik/core-utils';
import type { SongKey, MediaInfo, MusicDB } from './music';
import type { TrieNode } from './search';
import { Listener } from 'electron-promise-ipc/build/base';

const log = logger.bind('Communication');
logger.enable('Communication');

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

function SongKeyValidator(val: string): SongKey | void {
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

export function SendDatabase(): void {
  const musicDB = persist.getItem<MusicDB>('DB');
  if (!win || !musicDB) {
    setTimeout(SendDatabase, 10);
    return;
  }
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Albums', value: musicDB.albums }),
  );
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Songs', value: musicDB.songs }),
  );
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Artists', value: musicDB.artists }),
  );
}

function sendBackMediaInfo(songKey: SongKey, data: MediaInfo) {
  if (!win) return;
  win.webContents.send('mediainfo', FTON.stringify({ key: songKey, data }));
}

function getMetadata(songKey: SongKey) {
  const musicDB = persist.getItem<MusicDB>('DB');
  if (!musicDB) {
    log("Can't load DB");
    return;
  }
  const song = musicDB.songs.get(songKey);
  if (!song) {
    log("Can't find music key " + songKey);
    return;
  }
  getMediaInfo(song.path)
    .then((data: MediaInfo) => {
      log(`Fetched the media info for ${song.path}:`);
      log(data);
      sendBackMediaInfo(songKey, data);
    })
    .catch(log);
}

export function SetIndex(
  id: string,
  index: Map<string, TrieNode<unknown>>,
): void {
  indices.set(id, index);
}

// Walk down the Trie following the string
function search(val: string) {
  /*
  let vals = null;
  for (let i of val.split(' ')) {
    let index = indices.get('artist');
    if (!index) {
      break;
    }
    for (let c of Array.from(i)) {
      if (!index) {
        break;
      }
      vals = index.get(c);
      if (!vals) {
        break;
      }
    }
    if (vals) {
      if (!res) {
        res = new Set(vals.values);
      } else {
        const toRemove = [];
        for (let i of res) {
          if (!vals.values.has(i)) {
            toRemove.push(i);
          }
        }
        for (let i of toRemove) {
          vals.values.delete(i);
        }
      }
    }
  }
  if (!vals) {
    console.log('Nothing');
    return;
  }
  const results = [...vals.values].map((val) => val.key);
  console.log(results);
  */
}

// {key: 'item-to-pull-from-persist'}
// This is used for the promiseIpc main-side communication
async function ipcGetter(data: { key: unknown }) {
  try {
    log(`promise-get request: ${typeof data}`);
    log(data);
    if (
      typeof data !== 'object' ||
      !data.hasOwnProperty('key') ||
      typeof data.key !== 'string'
    ) {
      log(`error: invalid promise-get data type: ${typeof data}`);
      return;
    }
    const value = await persist.getItemAsync(data.key);
    log(`Sending value for key ${data.key}:`);
    log(value);
    // send the data back as the value from disk
    win!.webContents.send('promise-response', { key: data.key, value });
  } catch (e) {
    log('error from ipcGetter');
    log(e);
  }
  return;
}

// {key: 'item-to-put-in-persist', value: {thingToSave...} }
// This is used for the promiseIpc main-side communication
async function ipcSetter(data: { key: unknown; value: unknown }) {
  try {
    log(`promise-set request: ${typeof data}`);
    log(data);
    const kvp = kvpValidator(data);
    if (kvp) {
      await persist.setItemAsync(kvp.key, kvp.value as FTONData);
      return true;
    }
  } catch (e) {
    log('error from ipcSetter');
    log(e);
  }
  log('Trouble with promise-set');
  return false;
}

// {key: 'item-to-delete-from-persistence'}
async function ipcDeleter(data: { key: unknown }) {
  try {
    if (
      typeof data !== 'object' ||
      !data.hasOwnProperty('key') ||
      typeof data.key !== 'string'
    ) {
      log(`error: invalid promise-del data type: ${typeof data}`);
      return false;
    }
    await persist.deleteItemAsync(data.key);
    return true;
  } catch (e) {
    log('error from ipcDeleter');
    log(e);
  }
  return false;
}

// async function ipcSong(data: { key: unknown; value: unknown }) {}

// async function ipcSongs(data: { key: unknown; value: unknown }) {}

// async function ipcSongKeys(data: { key: unknown; value: unknown }) {}

async function ipcMediaInfo(key: string) {
  if (typeof key !== 'string') {
    return;
  }
  const musicDB = await persist.getItemAsync<MusicDB>('DB');
  if (!musicDB) {
    log("Can't load DB");
    return;
  }
  const song = musicDB.songs.get(key);
  if (!song) {
    log("Can't find music key " + key);
    return;
  }
  const data: MediaInfo = await getMediaInfo(song.path);
  log(`Fetched the media info for ${song.path}:`);
  log(data);
  return { key, data };
}

// Called to just set stuff up (nothing has actually been done yet)
export function Init(): void {
  const comms = [
    mk<KVP<FTONData>>('set', kvpFromJSONValidator, setter),
    mk<string>('delete', stringValidator, deleter),
    mk<string>('get', stringValidator, getter),
    mk<string>('GetDatabase', stringValidator, SendDatabase),
    mk<string>('mediainfo', SongKeyValidator, getMetadata),
    mk<string>('search', stringValidator, search),
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
  // Persistence stuff migrated to Recoil :)
  promiseIpc.on('promise-get', ipcGetter as Listener);
  promiseIpc.on('promise-set', ipcSetter as Listener);
  promiseIpc.on('promise-del', ipcDeleter as Listener);
  /*
  promiseIpc.on('promise-artist', ipcArtist);
  promiseIpc.on('promise-artists', ipcArtists);
  promiseIpc.on('promise-artistKeys', ipcArtistKeys);
  promiseIpc.on('promise-album', ipcAlbum);
  promiseIpc.on('promise-albums', ipcAlbums);
  promiseIpc.on('promise-albumKeys', ipcAlbumKeys);
  promiseIpc.on('promise-song', ipcSong);
  promiseIpc.on('promise-songs', ipcSongs);
  promiseIpc.on('promise-songKeys', ipcSongKeys);
  */
  promiseIpc.on('promise-mediaInfo', ipcMediaInfo as Listener);
  /*
  promiseIpc.on('promise-playlist', ipcPlaylistDetails);
  promiseIpc.on('promise-playlists', ipcPlaylists);
  */
}

// Called with the window handle after it's been created
export function Begin(window: BrowserWindow): void {
  win = window;
  SendDatabase();
}
