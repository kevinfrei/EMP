import {
  Comparisons,
  fromSafeName,
  FTON,
  MakeError,
  MakeLogger,
  toSafeName,
  Type,
} from '@freik/core-utils';
import { exception } from 'console';
import { app } from 'electron';
import { promises as fsp } from 'fs';
import path from 'path';

const log = MakeLogger('playlists');
const err = MakeError('playlists-err');

function playlistDir(): string {
  return path.join(app.getPath('userData'), 'playlists');
}

function playlistName(file: string): string {
  return fromSafeName(file);
}

function playlistPath(name: string): string {
  return path.join(playlistDir(), toSafeName(name));
}

export async function renamePlaylist(data?: string): Promise<void> {
  log('renamePlaylist');
  try {
    const obj = FTON.parse(data || '');
    if (
      !Type.isObjectNonNull(obj) ||
      !Type.hasStr(obj, 'curName') ||
      !Type.hasStr(obj, 'newName')
    ) {
      err('Malformed message from rename-playlist invoke:');
      err(obj);
      return;
    }
    await fsp.rename(playlistPath(obj.curName), playlistPath(obj.newName));
    log('Renamed successfully:');
    log(data);
  } catch (e) {
    err('Unable to rename playlist:');
    err(data);
    err(e);
  }
}

export async function deletePlaylist(data?: string): Promise<void> {
  log('deletePlaylist');
  try {
    if (!data) throw exception('no data');
    await fsp.unlink(playlistPath(data));
    log('Deleted successfully:');
    log(data);
  } catch (e) {
    err('Unable to delete playlist:');
    err(data);
    err(e);
  }
}

export async function getPlaylists(data?: string): Promise<string[]> {
  log('getPlaylists');
  try {
    const res = await fsp.readdir(playlistDir());
    log('Playlists:');
    log(res);
    return res.map(playlistName);
  } catch (e) {
    err('Error while reading playlists:');
    err(e);
  }
  return [];
}

export async function savePlaylist(data?: string): Promise<void> {
  log('savePlaylist');
  try {
    if (!data) throw exception('No data!');
    const info = FTON.parse(data);
    if (
      !Type.hasStr(info, 'name') ||
      !Type.has(info, 'songs') ||
      !Type.isArrayOf(info.songs, Type.isString)
    ) {
      err('Invalid loadPlaylist data');
      err(data);
      err('--- parsed to ---');
      err(info);
      return;
    }
    try {
      await fsp.mkdir(playlistDir(), { recursive: true });
    } catch (e) {
      /* */
    }
    await fsp.writeFile(playlistPath(info.name), info.songs.join('\n'));
  } catch (e) {
    err('Error while saving playlist:');
    err(data);
    err(e);
  }
}

export async function loadPlaylist(data?: string): Promise<string[]> {
  log('loadPlaylist');
  try {
    if (!data) throw exception('No data!');
    if (!Type.isString(data)) {
      err('Invalid loadPlaylist data');
      err(data);
      return [];
    } else {
      const vals = await fsp.readFile(playlistPath(data), 'utf-8');
      return vals.split('\n').filter((s) => s.length > 0);
    }
  } catch (e) {
    err('Error while loading playlist:');
    err(data);
    err(e);
  }
  return [];
}

export async function checkPlaylists(data?: string): Promise<void> {
  log('checkPlaylists');
  if (data) {
    const names = FTON.parse(data);
    if (Type.isArrayOf(names, Type.isString)) {
      if (Comparisons.ArraySetEqual<string>(names, await getPlaylists())) {
        log("They're equal");
      } else {
        err('NOT equal :/');
      }
      return;
    }
  }
  err('checkPlaylists error:');
  err(data);
}
