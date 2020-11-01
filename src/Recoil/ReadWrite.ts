/* eslint-disable @typescript-eslint/naming-convention */
import { PlaylistName, SongKey } from '@freik/media-utils';
import { atom, selector } from 'recoil';
import { syncWithMainEffect } from './helpers';
import { songListAtom } from './Local';

// vvv That's a bug, pretty clearly :/
// eslint-disable-next-line no-shadow
export enum CurrentView {
  none = 0,
  recent = 1,
  album = 2,
  artist = 3,
  song = 4,
  playlist = 5,
  current = 6,
  settings = 7,
  search = 8,
}

export const mutedAtom = atom<boolean>({
  key: 'mute',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});
export const volumeAtom = atom<number>({
  key: 'volume',
  default: 0.5,
  effects_UNSTABLE: [syncWithMainEffect<number>()],
});

// This is the 'locations' for searching
export const locationsAtom = atom<string[]>({
  key: 'locations',
  default: [],
  effects_UNSTABLE: [syncWithMainEffect<string[]>()],
});

export const sortWithArticlesAtom = atom<boolean>({
  key: 'rSortWithArticles',
  default: true,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const curViewAtom = atom<CurrentView>({
  key: 'CurrentView',
  default: CurrentView.settings,
  effects_UNSTABLE: [syncWithMainEffect<CurrentView>()],
});

// For these things:
// n= Track #, r= Artist, l= Album, t= Title, y= Year
// Capital = descending, lowercase = ascending
// For album & artist sorting, q= total # (Quantity!) of tracks
// For artist sorting, s= # of Songs

export const albumListSortAtom = atom<string>({
  key: 'rAlbumListSort',
  default: 'ry',
});

export const artistListSortAtom = atom<string>({
  key: 'rArtistListSort',
  default: 'rl',
});

export const songListSortAtom = atom<string>({
  key: 'rSongListSort',
  default: 'rl',
});

const playlistsAtom = atom<Map<PlaylistName, SongKey[]>>({
  key: 'Playlists',
  default: new Map<PlaylistName, SongKey[]>(),
  effects_UNSTABLE: [syncWithMainEffect()],
});

// This filters the playlists to only the ones that are actually there
export const playlistsSel = selector<Map<PlaylistName, SongKey[]>>({
  key: 'ActualPlaylists',
  get: ({ get }) => {
    const theMap = get(playlistsAtom);
    const songs = new Set(get(songListAtom));
    const newMap = new Map<PlaylistName, SongKey[]>();
    for (const [name, keys] of theMap) {
      newMap.set(
        name,
        keys.filter((val) => songs.has(val)),
      );
    }
    return newMap;
  },
  set: ({ set }, newVal) => set(playlistsAtom, newVal),
});
