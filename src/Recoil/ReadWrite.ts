/* eslint-disable @typescript-eslint/naming-convention */
import { FTON, MakeLogger, Type } from '@freik/core-utils';
import { PlaylistName, SongKey } from '@freik/media-utils';
import { atom, selector, selectorFamily } from 'recoil';
import { InvokeMain } from '../MyWindow';
import { syncWithMainEffect } from './helpers';

const log = MakeLogger('ReadWrite', true);
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

// Sort with/without articles setting
export const ignoreArticlesAtom = atom<boolean>({
  key: 'rSortWithArticles',
  default: true,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

// Only show artists in the list who appear on full albums
export const showArtistsWithFullAlbumsAtom = atom<boolean>({
  key: 'FullAlbumsOnly',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const downloadAlbumArtworkAtom = atom({
  key: 'downloadAlbumArtwork',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const downloadArtistArtworkAtom = atom({
  key: 'downloadArtistArtwork',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const saveAlbumArtworkWithMusicAtom = atom({
  key: 'saveAlbumArtworkWithMusic',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const albumCoverNameAtom = atom({
  key: 'albumCoverName',
  default: '.CoverArt',
  effects_UNSTABLE: [syncWithMainEffect<string>()],
});

// The minimum # of songs an artist needs to show up in the artist list
export const minSongCountForArtistListAtom = atom<number>({
  key: 'MinSongCount',
  default: 1,
  effects_UNSTABLE: [syncWithMainEffect<number>()],
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

export const playlistNamesSel = selector<Set<PlaylistName>>({
  key: 'PlaylistNames',
  get: async ({ get }) => {
    const playlistsString = await InvokeMain('get-playlists');
    if (!playlistsString) {
      return new Set();
    }
    const parsed = FTON.parse(playlistsString);
    const strs = FTON.arrayOfStrings(parsed);
    return new Set(strs || []);
  },
  set: async ({ set }, newValue) => {
    await InvokeMain(
      'set-playlists',
      FTON.stringify(
        Type.isSetOf(newValue, Type.isString) ? [...newValue.values()] : [],
      ),
    );
  },
});

export const playlistSel = selectorFamily<SongKey[], PlaylistName>({
  key: 'PlaylistContents',
  get: (arg: PlaylistName) => async ({ get }) => {
    log('PlaylistContents');
    const listStr = await InvokeMain('load-playlist', arg);
    log('PlaylistContents returned');
    log(listStr);
    if (!listStr) {
      return [];
    }
    log('Parsing');
    const parse = FTON.parse(listStr);
    log('Parsed:');
    log(parse);
    return Type.isArrayOf(parse, Type.isString) ? parse : [];
  },
  set: (name: PlaylistName) => async ({ set, get }, newValue) => {
    const arg = { name, songs: Type.isArray(newValue) ? newValue : [] };
    await InvokeMain('save-playlist', FTON.stringify(arg));
    const names = get(playlistNamesSel);
    names.add(name);
    set(playlistNamesSel, new Set(names));
  },
});
