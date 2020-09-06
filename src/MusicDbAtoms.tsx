import { atom, selector } from 'recoil';

import {
  SongListSort,
  SortWithArticles,
  SyncedLocations,
} from './SettingsAtoms';
import { GetSongSorter, sorter } from './Sorters';

import type { SongKey } from './MyStore';
import type { MyWindow } from './AsyncDoodad';
import type { FTONData } from '@freik/core-utils';

declare let window: MyWindow;

export const AllSongKeys = selector<SongKey[]>({
  key: 'AllSongs',
  get: ({ get }) => {
    const locations = get(SyncedLocations.atom);
    const hash = locations.length;
    return [hash.toString()];
  },
});
/*
export const AllSongsSelector = selector<SongKey[]>({
  key: 'AllSongsSel',
  get: async ({ get }) => {


  },
});
// This handles sorting the AllSongs list according to the
// user preferences
export const SortedSongsSelector = selector<SongKey[]>({
  key: 'SortedSongs',
  get: ({ get }): SongKey[] => {
    const songSort = get(SongListSort.atom);
    const allSong = get(AllSongsAtom);
    const articlesSort: boolean = get(SortWithArticles.atom) || false;
    // TODO: I don't yet have the music DB available in Atoms
    // Gotta fix that before continuing...
    const comp: sorter = GetSongSorter(null, songSort, articlesSort);
    return allSong;
  },
});
*/
