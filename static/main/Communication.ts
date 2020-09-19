import { BrowserWindow } from 'electron';
import { ipcMain as betterIpc } from '@freik/electron-better-ipc';
import { Logger } from '@freik/core-utils';

import * as persist from './persist';
import {
  getAllAlbums,
  getAllArtists,
  getAllPlaylists,
  getAllSongs,
  getSongKeys,
  getSongByKey,
  getMediaInfoForSong,
} from './MusicAccess';

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

async function getGeneral(name: string) {
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

async function setGeneral(keyValuePair: string) {
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
// Called to just set stuff up (nothing has actually been done yet)
export function Init(): void {
  // I like this API much better, particularly in the render process
  log(betterIpc);
  betterIpc.answerRenderer('get-song-keys', getSongKeys);
  betterIpc.answerRenderer('get-song-by-key', getSongByKey);
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
  // win = window;
}
