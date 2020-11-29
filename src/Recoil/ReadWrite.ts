/* eslint-disable @typescript-eslint/naming-convention */
import { FTON, Type } from '@freik/core-utils';
import { PlaylistName, SongKey } from '@freik/media-utils';
import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import { InvokeMain } from '../MyWindow';
import { syncWithMainEffect } from './helpers';

// const log = MakeLogger('ReadWrite');
// const err = MakeError('ReadWrite-err');

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

export const mutedState = atom<boolean>({
  key: 'mute',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const volumeState = atom<number>({
  key: 'volume',
  default: 0.5,
  effects_UNSTABLE: [syncWithMainEffect<number>()],
});

// This is the 'locations' for searching
export const locationsState = atom<string[]>({
  key: 'locations',
  default: [],
  effects_UNSTABLE: [syncWithMainEffect<string[]>()],
});

// Sort with/without articles setting
export const ignoreArticlesState = atom<boolean>({
  key: 'rSortWithArticles',
  default: true,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

// Only show artists in the list who appear on full albums
export const showArtistsWithFullAlbumsState = atom<boolean>({
  key: 'FullAlbumsOnly',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const downloadAlbumArtworkState = atom({
  key: 'downloadAlbumArtwork',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const downloadArtistArtworkState = atom({
  key: 'downloadArtistArtwork',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const saveAlbumArtworkWithMusicState = atom({
  key: 'saveAlbumArtworkWithMusic',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const albumCoverNameState = atom({
  key: 'albumCoverName',
  default: '.CoverArt',
  effects_UNSTABLE: [syncWithMainEffect<string>()],
});

// The minimum # of songs an artist needs to show up in the artist list
export const minSongCountForArtistListState = atom<number>({
  key: 'MinSongCount',
  default: 1,
  effects_UNSTABLE: [syncWithMainEffect<number>()],
});

export const curViewState = atom<CurrentView>({
  key: 'CurrentView',
  default: CurrentView.settings,
  effects_UNSTABLE: [syncWithMainEffect<CurrentView>()],
});

// For these things:
// n= Track #, r= Artist, l= Album, t= Title, y= Year
// Capital = descending, lowercase = ascending
// For album & artist sorting, q= total # (Quantity!) of tracks
// For artist sorting, s= # of Songs

export const albumListSortState = atom<string>({
  key: 'rAlbumListSort',
  default: 'ry',
});

export const artistListSortState = atom<string>({
  key: 'rArtistListSort',
  default: 'rl',
});

export const songListSortState = atom<string>({
  key: 'rSongListSort',
  default: 'rl',
});

// Stuff for playlists

const playlistNamesBackerState = atom<string[] | false>({
  key: 'playlistNames-backer',
  default: false,
});

export const playlistNamesState = selector<Set<PlaylistName>>({
  key: 'PlaylistNames',
  get: async ({ get }) => {
    const backed = get(playlistNamesBackerState);
    if (backed === false) {
      const playlistsString = await InvokeMain('get-playlists');
      if (!playlistsString) {
        return new Set();
      }
      const parsed = FTON.parse(playlistsString);
      const strs = FTON.arrayOfStrings(parsed);
      return new Set(strs || []);
    } else {
      return new Set(backed);
    }
  },
  set: async ({ set }, newValue) => {
    const data = Type.isSetOf(newValue, Type.isString) ? [...newValue] : [];
    set(playlistNamesBackerState, data);
    await InvokeMain('set-playlists', FTON.stringify(data));
  },
});

const getPlaylistBackerState = atomFamily<SongKey[] | false, PlaylistName>({
  key: 'playlistFamilyBacker',
  default: false,
});

export const getPlaylistState = selectorFamily<SongKey[], PlaylistName>({
  key: 'PlaylistContents',
  get: (arg: PlaylistName) => async ({ get }) => {
    const backed = get(getPlaylistBackerState(arg));
    if (backed === false) {
      const listStr = await InvokeMain('load-playlist', arg);
      if (!listStr) {
        return [];
      }
      const parse = FTON.parse(listStr);
      return Type.isArrayOf(parse, Type.isString) ? parse : [];
    } else {
      return backed;
    }
  },
  set: (name: PlaylistName) => async ({ set, get }, newValue) => {
    const names = get(playlistNamesState);
    if (!names.has(name)) {
      names.add(name);
      set(playlistNamesState, new Set(names));
    }
    const songs = Type.isArray(newValue) ? newValue : [];
    set(getPlaylistBackerState(name), songs);
    await InvokeMain('save-playlist', FTON.stringify({ name, songs }));
  },
});
