// @flow
const { ipcMain, BrowserWindow, WebContents } = require('electron');
const logger = require('simplelogger');
const { FTON } = require('my-utils');

const persist = require('./persist');
const { getMediaInfo } = require('./music');

import type { FTONData } from 'my-utils';
import type { SongKey, MediaInfo } from './music';
import type { TrieNode } from './search';

const log = logger.bind('Communication');
logger.enable('Communication');

export type MessageHandler<T> = {
  command: string,
  validator: (val: string) => ?T,
  handler: (data: T) => void,
};

export type KVP = {
  key: string,
  value: FTONData,
};

const indices: Map<string, Map<string, TrieNode<*>>> = new Map();

let win: ?WebContents = null;

function getWebContents() {
  const allWnd: Array<BrowserWindow> = BrowserWindow.getAllWindows();
  if (allWnd.length < 1) {
    log('No browser windows found in get operation.');
    return;
  }
  return allWnd[0].webContents;
}

function kvpValidator(val: string): ?KVP {
  try {
    const res = FTON.parse(val);
    if (
      typeof res === 'object' &&
      res !== null &&
      typeof res.key === 'string' &&
      typeof res.value !== 'undefined'
    ) {
      return { key: res.key, value: res.value };
    }
  } catch (e) {}
  return undefined;
}

function stringValidator(val: string): ?string {
  return val;
}

function SongKeyValidator(val: string): ?SongKey {
  return val;
}

function setter({ key, value }: KVP) {
  log(`Persisting '${key}' to:`);
  if (key.toLowerCase() !== 'db') log(value);
  else log('{music database...}');
  persist.setItem(key, FTON.stringify(value));
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
  validator: (val: string) => ?T,
  handler: (data: T) => void
): MessageHandler<T> {
  return { command, validator, handler };
}

function SendDatabase() {
  const musicDB = persist.getItem('DB');
  if (!win || !musicDB) {
    setTimeout(SendDatabase, 10);
    return;
  }
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Albums', value: musicDB.albums })
  );
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Songs', value: musicDB.songs })
  );
  win.webContents.send(
    'data',
    FTON.stringify({ key: 'Artists', value: musicDB.artists })
  );
}

function sendBackMediaInfo(songKey: SongKey, data: MediaInfo) {
  if (!win) return;
  win.webContents.send('mediainfo', FTON.stringify({ key: songKey, data }));
}

function getMetadata(songKey: SongKey) {
  const musicDB = persist.getItem('DB');
  if (!musicDB) {
    console.log("Can't load DB");
    return;
  }
  const song = musicDB.songs.get(songKey);
  if (!song) {
    console.log("Can't find music key " + songKey);
    return;
  }
  getMediaInfo(song.path)
    .then((data: MediaInfo) => {
      log(`Fetched the media info for ${song.path}:`);
      log(data);
      sendBackMediaInfo(songKey, data);
    })
    .catch(console.log);
}

function SetIndex(id: string, index: Map<string, TrieNode<*>>) {
  indices.set(id, index);
}

// Walk down the Trie following the string
function search(val: string) {
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
}

// Called to just set stuff up (nothing has actually been done yet)
function Init() {
  const comms = [
    mk<KVP>('set', kvpValidator, setter),
    mk<string>('delete', stringValidator, deleter),
    mk<string>('get', stringValidator, getter),
    mk<string>('GetDatabase', stringValidator, SendDatabase),
    mk<string>('mediainfo', SongKeyValidator, getMetadata),
    mk<string>('search', stringValidator, search)
  ];
  for (let val of comms) {
    ipcMain.on(val.command, (event, arg: string) => {
      const data: ?T = val.validator(arg);
      if (data !== undefined && data !== null) {
        log(`Got data for "${val.command}":`);
        log(data);
        val.handler(data);
      } else {
        log(`data validation failure while checking ${val.command}`);
        log(arg);
      }
    });
  }
}

// Called with the window handle after it's been created
function Begin(window) {
  win = window;
  SendDatabase();
}

module.exports = { Init, Begin, SendDatabase, SetIndex };
