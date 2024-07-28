import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { ArraySetEqual } from '@freik/helpers';
import { Playlist, PlaylistName, SongKey } from '@freik/media-core';
import { isArrayOfString, isFunction } from '@freik/typechk';
import { atom } from 'jotai';
import { atomFamily, RESET } from 'jotai/utils';
import { SetStateActionWithReset, WritableAtomType } from './Hooks';
import { activePlaylistState } from './SongPlayback';
import { getStore, MyStore } from './Storage';

// const { wrn } = MakeLog('EMP:UI:PlaylistControl');

let theCache: Map<PlaylistName, Playlist> | undefined = undefined;

async function getCache(): Promise<Map<PlaylistName, Playlist>> {
  if (!theCache) {
    const names = await Ipc.CallMain(
      IpcId.GetPlaylists,
      undefined,
      isArrayOfString,
    );
    if (names) {
      theCache = new Map();
      await Promise.all(
        names.map(async (name) => {
          const contents = await Ipc.CallMain(
            IpcId.LoadPlaylist,
            name,
            isArrayOfString,
          );
          if (contents) {
            theCache!.set(name, contents);
          }
        }),
      );
    }
  }
  return theCache || new Map();
}

export const allPlaylistsState = atom(
  async () => {
    return await getCache();
  },
  async (_get, _set, newVal: Map<PlaylistName, Playlist>) => {
    const oldVal = await getCache();
    theCache = newVal;
    if (oldVal.size !== newVal.size) {
      // Add or delete some playlists
      const oldKeys = new Set(oldVal.keys());
      const newKeys = new Set(newVal.keys());
      const toDelete = [...oldKeys].filter((k) => !newKeys.has(k));
      const toAdd = [...newKeys].filter((k) => !oldKeys.has(k));
      await Promise.all([
        ...toDelete.map(async (key) => {
          await Ipc.PostMain(IpcId.DeletePlaylist, key);
        }),
        ...toAdd.map(async (key) => {
          await Ipc.PostMain(IpcId.SavePlaylist, {
            name: key,
            songs: newVal.get(key),
          });
        }),
      ]);
    }
    // For every 'common' key, we need to check if the value has changed
    await Promise.all(
      [...oldVal.keys()].map(async (key) => {
        const olds = oldVal.get(key);
        const news = newVal.get(key);
        if (
          olds &&
          news &&
          (olds.length !== news.length || !ArraySetEqual([...olds], [...news]))
        ) {
          await Ipc.PostMain(IpcId.SavePlaylist, { name: key, songs: news });
        }
      }),
    );
  },
);

export const playlistStateFamily = atomFamily<
  PlaylistName,
  WritableAtomType<SongKey[]>
>((name: PlaylistName) =>
  atom(
    async (get) => {
      const pl = await get(allPlaylistsState);
      return pl.get(name) || [];
    },
    async (
      get,
      set,
      param: SetStateActionWithReset<Playlist | Promise<Playlist>>,
    ) => {
      const oldVal = await get(allPlaylistsState);
      const newThing = await (isFunction(param)
        ? param(oldVal.get(name) || [])
        : param);
      const newMap = new Map(oldVal);
      if (newThing === RESET) {
        newMap.delete(name);
      } else {
        newMap.set(name, newThing);
      }
      set(allPlaylistsState, newMap);
    },
  ),
);

export const playlistNamesState = atom(async (get) => {
  return [...(await get(allPlaylistsState)).keys()];
});

// TODO: Need to add the ability to delete a playlist :/
// This decides if the current playlist is something that can be 'saved'
// (Is it already a playlist or not?)
export const saveableState = atom(
  async (get) => (await get(activePlaylistState)) === '',
);

export async function DeletePlaylist(
  name: PlaylistName,
  store?: MyStore,
): Promise<void> {
  store = store || getStore();
  const oldVal = await store.get(allPlaylistsState);
  const newMap = new Map(oldVal);
  newMap.delete(name);
  await store.set(allPlaylistsState, newMap);
}

export async function RenamePlaylist(
  oldName: PlaylistName,
  newName: PlaylistName,
  store?: MyStore,
): Promise<void> {
  store = store || getStore();
  const oldVal = await store.get(allPlaylistsState);
  const newMap = new Map(oldVal);
  const oldList = newMap.get(oldName);
  if (oldList) {
    newMap.delete(oldName);
    newMap.set(newName, oldList);
    await store.set(allPlaylistsState, newMap);
  }
}
