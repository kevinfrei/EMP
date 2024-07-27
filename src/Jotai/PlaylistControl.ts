import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import { Playlist, PlaylistName, SongKey } from '@freik/media-core';
import { isArrayOfString, isUndefined } from '@freik/typechk';
import { atom } from 'jotai';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import { isPlaylist } from '../Tools';
import { WritableAtomType } from './Hooks';
import { activePlaylistState, songListState } from './SongPlayback';

const { wrn } = MakeLog('EMP:UI:PlaylistControl');

type MaybePlaylist = Playlist | false;
let readOnce = false;
const localCache: Map<PlaylistName, MaybePlaylist> = new Map();

async function ensureCacheInitialized() {
  if (!readOnce) {
    const names = await Ipc.CallMain(
      IpcId.GetPlaylists,
      undefined,
      isArrayOfString,
    );
    if (names) {
      readOnce = true;
      names.forEach((name) => localCache.set(name, false));
    }
  }
}

const playlistStorage = {
  getItem: async (key: PlaylistName): Promise<Playlist> => {
    await ensureCacheInitialized();

    if (localCache.has(key)) {
      const maybe: MaybePlaylist | undefined = localCache.get(key);
      if (maybe === false) {
        const contents = await Ipc.CallMain(
          IpcId.LoadPlaylist,
          key,
          isArrayOfString,
        );
        if (contents) {
          localCache.set(key, contents);
        }
      }
      const pl = localCache.get(key);
      if (pl === false || isUndefined(pl)) {
        wrn('Playlist not found:', key);
        return [];
      }
      return pl;
    }
    return [];
  },
  setItem: async (key: PlaylistName, value: SongKey[]) => {
    localCache.set(key, value);
    await Ipc.PostMain(IpcId.SavePlaylist, [key, value]);
  },
  removeItem: async (key: PlaylistName) => {
    localCache.delete(key);
    await Ipc.PostMain(IpcId.DeletePlaylist, key);
  },
};

export const playlistStateFamily = atomFamily<
  PlaylistName,
  WritableAtomType<SongKey[]>
>((name: PlaylistName) =>
  atomWithStorage(name, [], playlistStorage, { getOnInit: true }),
);

// TODO: Need to add the ability to delete a playlist :/
// This decides if the current playlist is something that can be 'saved'
// (Is it a playlist, and has it been modified)
export const saveableState = atom(async (get) => {
  const curPlaylist = await get(activePlaylistState);
  if (isPlaylist(curPlaylist)) {
    const theSongList = await get(playlistStateFamily(curPlaylist));
    const songList = await get(songListState);
    if (songList.length !== theSongList.length) {
      return true;
    }
    const savedList = new Set(theSongList);
    for (let i = 0; i < songList.length; i++) {
      if (!savedList.has(songList[i])) {
        return true;
      }
    }
  }
  // If it's not a playlist, you can't save it
  return false;
});

export const playlistNamesState = atom((get) => {
  ['abc', 'def'];
});
