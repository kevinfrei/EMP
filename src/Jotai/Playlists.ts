import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { PlaylistName, SongKey } from '@freik/media-core';
import { isArray, isArrayOfString, isSetOfString } from '@freik/typechk';
import { atom } from 'jotai';
import { RESET, atomFamily, atomWithReset } from 'jotai/utils';
import { isPlaylist } from '../Tools';
import { activePlaylistState, songListState } from './SongsPlaying';

// Stuff for playlists

const playlistNamesBackerState = atomWithReset<string[] | false>(false);

// function playlistNamesGetter(
//   get: <T>(a: RecoilValue<T>) => T,
// ): Set<PlaylistName> | undefined {
//   const backed = get(playlistNamesBackerState);
//   if (backed === false) {
//     return;
//   }
//   return new Set(backed);
// }

export const playlistNamesFunc = atom(
  async (get) => {
    const backed = get(playlistNamesBackerState);
    if (backed === false) {
      const playlistsString = await Ipc.CallMain<string[], void>(
        IpcId.GetPlaylists,
        undefined,
        isArrayOfString,
      );
      if (!playlistsString) {
        return new Set<string>();
      }
      return new Set(playlistsString);
    } else {
      return new Set(backed);
    }
  },
  async (get, set, newValue: Set<string> | typeof RESET) => {
    const data = isSetOfString(newValue) ? [...newValue] : [];
    set(playlistNamesBackerState, data);
    await Ipc.PostMain(IpcId.SetPlaylists, data);
  },
);

const playlistBackerFam = atomFamily(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_name: PlaylistName) =>
    atomWithReset<SongKey[] | false | typeof RESET>(false),
);

// function playlistGetter(
//   get: <T>(a: RecoilValue<T>) => T,
//   name: PlaylistName,
// ): SongKey[] | undefined {
//   const backed = get(playlistBackerFam(name));
//   return !backed ? undefined : backed;
// }

export const playlistFuncFam = atomFamily((name: PlaylistName) =>
  atom(
    async (get) => {
      const backed = get(playlistBackerFam(name));
      if (backed === false) {
        const listStr = await Ipc.CallMain(
          IpcId.LoadPlaylists,
          name,
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
    async (get, set, newValue: SongKey[]): Promise<void> => {
      const names = await get(playlistNamesFunc);
      if (!names.has(name)) {
        names.add(name);
        await set(playlistNamesFunc, new Set(names));
      }
      const songs = isArray(newValue) ? newValue : [];
      set(playlistBackerFam(name), songs);
      void Ipc.PostMain(IpcId.SavePlaylist, { name, songs });
    },
  ),
);

export const allPlaylistsFunc = atom(
  async (get): Promise<Map<PlaylistName, SongKey[]>> => {
    const res = new Map<PlaylistName, SongKey[]>();
    for (const plName of await get(playlistNamesFunc)) {
      const content = get(playlistBackerFam(plName));
      if (content === RESET || content === false) {
        res.delete(plName);
      } else {
        res.set(plName, content);
      }
    }
    return res;
  },
);

// This decides if the current playlist is something that can be 'saved'
// (Is it a playlist, and has it been modified)
export const saveableFunc = atom(async (get) => {
  const curPlaylist = await get(activePlaylistState);
  if (isPlaylist(curPlaylist)) {
    const theSongList = await get(playlistFuncFam(curPlaylist));
    if (theSongList === RESET) {
      return false;
    }
    const songList = await get(songListState);
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
});
