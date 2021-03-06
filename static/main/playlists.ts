import {
  FromPathSafeName,
  MakeError,
  MakeLogger,
  Operations,
  Sleep,
  ToPathSafeName,
  Type,
} from '@freik/core-utils';
import { SongKey } from '@freik/media-core';
import { exception } from 'console';
import { app } from 'electron';
import { promises as fsp } from 'fs';
import path from 'path';
import { GetAudioDB } from './AudioDatabase';

const log = MakeLogger('playlists');
const err = MakeError('playlists-err');

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
    err('Unable to rename playlist:');
    err(curName);
    err(newName);
    err(e);
  }
}

export async function DeletePlaylist(data: string): Promise<void> {
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

export async function GetPlaylists(): Promise<string[]> {
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

export type PlaylistSaveData = {
  name: string;
  songs: SongKey[];
};

// eslint-disable-next-line
export function isPlaylistSaveData(data: any): data is PlaylistSaveData {
  return (
    Type.hasStr(data, 'name') &&
    Type.has(data, 'songs') &&
    Type.isArrayOfString(data.songs)
  );
}

export async function SavePlaylist(data: PlaylistSaveData): Promise<void> {
  log('savePlaylist');
  try {
    try {
      await fsp.mkdir(playlistDir(), { recursive: true });
    } catch (e) {
      /* */
    }
    await fsp.writeFile(
      playlistPath(data.name),
      await toDiskFormat(data.songs),
    );
  } catch (e) {
    err('Error while saving playlist:');
    err(data);
    err(e);
  }
}

export async function LoadPlaylist(data: string): Promise<string[]> {
  log('loadPlaylist');
  try {
    const vals = await fsp.readFile(playlistPath(data), 'utf-8');
    return await fromDiskFormat(vals);
  } catch (e) {
    err('Error while loading playlist:');
    err(data);
    err(e);
  }
  return [];
}

export async function CheckPlaylists(names: string[]): Promise<void> {
  log('checkPlaylists');
  if (Operations.ArraySetEqual<string>(names, await GetPlaylists())) {
    log("They're equal");
  } else {
    err('NOT equal :/');
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
  const lines = flat.split('\n');
  const db = await GetAudioDB();
  while (db.getLocations().length === 0) {
    await Sleep(50);
  }
  return lines
    .slice(1)
    .map((p) => db.getSongFromPath(p))
    .filter((kOrV) => db.getSong(kOrV));
}
