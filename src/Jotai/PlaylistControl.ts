import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { PlaylistName, SongKey } from '@freik/media-core';
import { isArrayOfString } from '@freik/typechk';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import { WritableAtomType } from './Hooks';

let uncachedNames: Set<PlaylistName> | undefined = undefined;
const localCache: Map<PlaylistName, SongKey[]> = new Map();

const playlistStorage = {
  getItem: async (key: PlaylistName) => {
    if (localCache.has(key)) {
      // assert(!uncachedNames.has(key));
      return localCache.get(key)!;
    }
    if (uncachedNames === undefined) {
      const names = await Ipc.CallMain(
        IpcId.GetPlaylists,
        undefined,
        isArrayOfString,
      );
      uncachedNames = new Set(names || []);
    }
    const contents = await Ipc.CallMain<SongKey[], PlaylistName>(
      IpcId.LoadPlaylists,
      key,
      isArrayOfString,
    );
    if (contents) {
      uncachedNames.delete(key);
      localCache.set(key, contents);
      return contents;
    }
    return [];
  },
  setItem: async (key: PlaylistName, value: SongKey[]) => {
    uncachedNames?.delete(key);
    localCache.set(key, value);
    await Ipc.PostMain(IpcId.SavePlaylist, [key, value]);
  },
  removeItem: async (key: PlaylistName) => {
    localCache.delete(key);
    await Ipc.PostMain(IpcId.DeletePlaylist, key);
  },
};

// TODO: continue here. Need to deal with PlaylistNames somehow

export const playlistStateFamily = atomFamily<
  PlaylistName,
  WritableAtomType<SongKey[]>
>((name: PlaylistName) =>
  atomWithStorage(name, [], playlistStorage, { getOnInit: true }),
);
