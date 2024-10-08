import { ArraySetEqual } from '@freik/helpers';
import { MakeLog } from '@freik/logger';
import { SongKey } from '@freik/media-core';
import { Sleep } from '@freik/sync';
import { FromPathSafeName, ToPathSafeName } from '@freik/text';
import {
  chkObjectOfExactType,
  isArrayOfString,
  isString,
  typecheck,
} from '@freik/typechk';
import { app } from 'electron';
import { promises as fsp } from 'fs';
import path from 'path';
import { GetAudioDB } from './AudioDatabase.js';

const { log, wrn } = MakeLog('EMP:main:playlists');

function playlistDir(): string {
  return path.join(app.getPath('userData'), 'playlists');
}

function playlistName(file: string): string {
  return FromPathSafeName(file);
}

function playlistPath(name: string): string {
  return path.join(playlistDir(), ToPathSafeName(name));
}

export async function RenamePlaylist([curName, newName]: [
  string,
  string,
]): Promise<void> {
  log('renamePlaylist');
  try {
    await fsp.rename(playlistPath(curName), playlistPath(newName));
    log('Renamed successfully:');
  } catch (e) {
    wrn('Unable to rename playlist:');
    wrn(curName);
    wrn(newName);
    wrn(e);
  }
}

export async function DeletePlaylist(data: string): Promise<void> {
  log('deletePlaylist');
  try {
    if (!data) throw Error('no data');
    await fsp.unlink(playlistPath(data));
    log('Deleted successfully:');
    log(data);
  } catch (e) {
    wrn('Unable to delete playlist:');
    wrn(data);
    wrn(e);
  }
}

export async function GetPlaylists(): Promise<string[]> {
  log('getPlaylists');
  try {
    const res = await fsp.readdir(playlistDir());
    log('Playlists:');
    log(res);
    return res.map(playlistName);
  } catch (e) {
    wrn('Error while reading playlists:');
    wrn(e);
  }
  try {
    await fsp.mkdir(playlistDir());
  } catch (e) {
    wrn('Errow while trying to create the playlist dir');
    wrn(e);
  }
  return [];
}

export type PlaylistSaveData = {
  name: string;
  songs: SongKey[];
};

export const isPlaylistSaveData: typecheck<PlaylistSaveData> =
  chkObjectOfExactType<PlaylistSaveData>({
    name: isString,
    songs: isArrayOfString,
  });

export async function SavePlaylist(data: PlaylistSaveData): Promise<void> {
  log('savePlaylist');
  try {
    try {
      await fsp.mkdir(playlistDir(), { recursive: true });
    } catch {
      /* */
    }
    await fsp.writeFile(
      playlistPath(data.name),
      await toDiskFormat(data.songs),
    );
  } catch (e) {
    wrn('Error while saving playlist:');
    wrn(data);
    wrn(e);
  }
}

export async function LoadPlaylist(data: string): Promise<string[]> {
  log('loadPlaylist');
  try {
    const vals = await fsp.readFile(playlistPath(data), 'utf-8');
    return await fromDiskFormat(vals);
  } catch (e) {
    wrn('Error while loading playlist:');
    wrn(data);
    wrn(e);
  }
  return [];
}

export async function CheckPlaylists(names: string[]): Promise<void> {
  log('checkPlaylists');
  if (ArraySetEqual<string>(names, await GetPlaylists())) {
    log("They're equal");
  } else {
    wrn('NOT equal :/');
  }
  return;
}

async function toDiskFormat(keys: SongKey[]): Promise<string> {
  const db = await GetAudioDB();
  const res = ['#EXTM3U'];
  for (const key of keys) {
    const song = db.getSong(key);
    if (!song) {
      log(`Invalid SongKey ${key} in playlist`);
    } else {
      res.push(song.path);
    }
  }
  return res.join('\n');
}

async function fromDiskFormat(flat: string): Promise<SongKey[]> {
  const lines = flat.split('\n').filter((val: string) => val.trim().length > 0);
  const db = await GetAudioDB();
  while (db.getLocations().length === 0) {
    await Sleep(50);
  }
  return lines
    .slice(1)
    .map((p) => db.getSongFromPath(p))
    .filter((kOrV) => db.getSong(kOrV));
}
