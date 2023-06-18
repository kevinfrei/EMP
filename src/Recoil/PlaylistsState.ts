/* eslint-disable @typescript-eslint/naming-convention */
import { Ipc } from '@freik/electron-render';
import { PlaylistName, SongKey } from '@freik/media-core';
import { isArray, isArrayOfString, isSetOfString } from '@freik/typechk';
import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import { IpcId } from '@freik/emp-shared';
import { isPlaylist } from '../Tools';
import { activePlaylistState, songListState } from './SongPlaying';

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
        IpcId.GetPlaylists,
        undefined,
        isArrayOfString,
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
    const data = isSetOfString(newValue) ? [...newValue] : [];
    set(playlistNamesBackerState, data);
    void Ipc.PostMain(IpcId.SetPlaylists, data);
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
          IpcId.LoadPlaylists,
          arg,
          isArrayOfString,
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
      const songs = isArray(newValue) ? newValue : [];
      set(playlistBackerFam(name), songs);
      void Ipc.PostMain(IpcId.SavePlaylist, { name, songs });
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

// This decides if the current playlist is something that can be 'saved'
// (Is it a playlist, and has it been modified)
export const saveableFunc = selector<boolean>({
  key: 'shouldSaveBeDisabled',
  get: ({ get }) => {
    const curPlaylist = get(activePlaylistState);
    if (isPlaylist(curPlaylist)) {
      const theSongList = get(playlistFuncFam(curPlaylist));
      const songList = get(songListState);
      if (songList.length !== theSongList.length) {
        return true;
      }
      for (let i = 0; i < songList.length; i++) {
        if (songList[i] !== theSongList[i]) {
          return true;
        }
      }
    }
    // If it's not a playlist, you can't save it
    return false;
  },
});
