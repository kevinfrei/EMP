/* eslint-disable @typescript-eslint/naming-convention */
import { Operations, Type } from '@freik/core-utils';
import { Ipc } from '@freik/elect-render-utils';
import { PlaylistName, SongKey } from '@freik/media-core';
import {
  atom,
  atomFamily,
  RecoilValue,
  selector,
  selectorFamily,
} from 'recoil';
import { isPlaylist } from '../Tools';
import { activePlaylistState, songListState } from './Local';

// Stuff for playlists

const playlistNamesBackerState = atom<string[] | false>({
  key: 'playlistNames-backer',
  default: false,
});

// function playlistNamesGetter(
//   get: <T>(a: RecoilValue<T>) => T,
// ): Set<PlaylistName> | undefined {
//   const backed = get(playlistNamesBackerState);
//   if (backed === false) {
//     return;
//   }
//   return new Set(backed);
// }

export const playlistNamesFunc = selector<Set<PlaylistName>>({
  key: 'PlaylistNames',
  get: async ({ get }) => {
    const backed = get(playlistNamesBackerState);
    if (backed === false) {
      const playlistsString = await Ipc.CallMain<string[], void>(
        'get-playlists',
        undefined,
        Type.isArrayOfString,
      );
      if (!playlistsString) {
        return new Set();
      }
      return new Set(playlistsString);
    } else {
      return new Set(backed);
    }
  },
  set: ({ set }, newValue) => {
    const data = Type.isSetOfString(newValue) ? [...newValue] : [];
    set(playlistNamesBackerState, data);
    void Ipc.PostMain('set-playlists', data);
  },
});

const playlistBackerFam = atomFamily<SongKey[] | false, PlaylistName>({
  key: 'playlistFamilyBacker',
  default: false,
});

// function playlistGetter(
//   get: <T>(a: RecoilValue<T>) => T,
//   name: PlaylistName,
// ): SongKey[] | undefined {
//   const backed = get(playlistBackerFam(name));
//   return !backed ? undefined : backed;
// }

export const playlistFuncFam = selectorFamily<SongKey[], PlaylistName>({
  key: 'PlaylistContents',
  get:
    (arg: PlaylistName) =>
    async ({ get }) => {
      const backed = get(playlistBackerFam(arg));
      if (backed === false) {
        const listStr = await Ipc.CallMain(
          'load-playlist',
          arg,
          Type.isArrayOfString,
        );
        if (!listStr) {
          return [];
        }
        return listStr;
      } else {
        return backed;
      }
    },
  set:
    (name: PlaylistName) =>
    ({ set, get }, newValue) => {
      const names = get(playlistNamesFunc);
      if (!names.has(name)) {
        names.add(name);
        set(playlistNamesFunc, new Set(names));
      }
      const songs = Type.isArray(newValue) ? newValue : [];
      set(playlistBackerFam(name), songs);
      void Ipc.PostMain('save-playlist', { name, songs });
    },
});

export const allPlaylistsFunc = selector<Map<PlaylistName, SongKey[]>>({
  key: 'AllPlaylists',
  get: ({ get }) => {
    const res = new Map<PlaylistName, SongKey[]>();
    for (const plName of get(playlistNamesFunc)) {
      res.set(plName, get(playlistFuncFam(plName)));
    }
    return res;
  },
});

function saveableGetter(get: <T>(a: RecoilValue<T>) => T): boolean {
  const curPlaylist = get(activePlaylistState);
  if (isPlaylist(curPlaylist)) {
    const theSongList = get(playlistFuncFam(curPlaylist));
    const songList = get(songListState);
    return !Operations.ArraySetEqual(theSongList, songList);
  } else {
    // If it's not a playlist, you can't save it
    return false;
  }
}

// This decides if the current playlist is something that can be 'saved'
// (Is it a playlist, and has it been modified)
export const saveableFunc = selector<boolean>({
  key: 'shouldSaveBeDisabled',
  get: ({ get }): boolean => saveableGetter(get),
});
