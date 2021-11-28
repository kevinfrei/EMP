/* eslint-disable @typescript-eslint/naming-convention */
import { SongKey } from '@freik/media-core';
import { atom, selector, selectorFamily } from 'recoil';
import { syncWithMainEffect } from './helpers';
import { isMiniplayerState } from './Local';
import { maybeAlbumByKeyFuncFam, maybeArtistByKeyFuncFam } from './ReadOnly';

// const log = MakeLogger('ReadWrite');
// const err = MakeError('ReadWrite-err');

// vvv That's a bug, pretty clearly :/
// eslint-disable-next-line no-shadow
export enum CurrentView {
  disabled = -1,
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

export const shuffleState = atom<boolean>({
  key: 'shuffle',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const repeatState = atom<boolean>({
  key: 'repeat',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

// This is the 'locations' for searching
export const locationsState = atom<string[]>({
  key: 'locations',
  default: [],
  effects_UNSTABLE: [syncWithMainEffect<string[]>()],
});

export const defaultLocationState = atom<string>({
  key: 'defaultLocation',
  default: '',
  effects_UNSTABLE: [syncWithMainEffect<string>()],
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

const curViewBackerState = atom<CurrentView>({
  key: 'CurrentView',
  default: CurrentView.settings,
  effects_UNSTABLE: [syncWithMainEffect<CurrentView>()],
});

// This makes the miniplayer view always select the current view
export const curViewFunc = selector<CurrentView>({
  key: 'CurViewWithMiniplayerAwareness',
  get: ({ get }) =>
    get(isMiniplayerState) ? CurrentView.current : get(curViewBackerState),
  set: ({ set }, newVal) => set(curViewBackerState, newVal),
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

export const songListFromKeyFuncFam = selectorFamily<SongKey[] | null, string>({
  key: 'songsFromKey',
  get: (arg: string) => ({ get }) => {
    if (arg.startsWith('S')) {
      return [arg];
    }
    if (arg.startsWith('L')) {
      const alb = get(maybeAlbumByKeyFuncFam(arg));
      if (!alb) {
        return null;
      }
      return alb.songs;
    }
    if (arg.startsWith('R')) {
      const art = get(maybeArtistByKeyFuncFam(arg));
      if (!art) {
        return null;
      }
      return art.songs;
    }
    return null;
  },
});
