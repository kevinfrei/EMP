import { atom, selector } from 'recoil';
import { logger } from '@freik/simplelogger';
import {
  SongListSort,
  SortWithArticles,
  SyncedLocations,
} from './SettingsAtoms';
import { GetSongSorter, sorter } from './Sorters';

import type { Song, SongKey } from './MyStore';
import type { MyWindow } from './AsyncDoodad';
import type { FTONData } from '@freik/core-utils';

const log = logger.bind('MusicDbAtoms');
// logger.enable('MusicDbAtoms')

declare let window: MyWindow;

export const AllSongsSel = selector<Map<SongKey, Song>>({
  key: 'AllSongs',
  get: async ({ get }): Promise<Map<SongKey, Song>> => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const locations = get(SyncedLocations.atom);
    log(locations.length);
    const res = await window.betterIpc?.callMain<void, Map<SongKey, Song>>(
      'get-all-songs',
    );
    return res || new Map<SongKey, Song>();
  },
});

export const AllSongKeys = selector<SongKey[]>({
  key: 'AllSongs',
  get: ({ get }) => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const songs = get(AllSongsSel);
    return [...songs.keys()];
  },
});
// This handles sorting the AllSongs list according to the
// user preferences
export const SortedSongsSelector = selector<SongKey[]>({
  key: 'SortedSongs',
  get: ({ get }): SongKey[] => {
    const songSort = get(SongListSort.atom);
    const allSongs = [...get(AllSongsKeys)];
    const articlesSort: boolean = get(SortWithArticles.atom);
    // TODO: I don't yet have the music DB available in Atoms
    // Gotta fix that before continuing...
    const comp: sorter = GetSongSorter(get, songSort, articlesSort);
    allSongs.sort(comp);
  },
});
*/
