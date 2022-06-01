/* eslint-disable @typescript-eslint/naming-convention */
import { Effects } from '@freik/elect-render-utils';
import { SongKey } from '@freik/media-core';
import { atom, selector, selectorFamily } from 'recoil';
import { CurrentView } from 'shared';
import { ShuffleArray } from '../Tools';
import {
  currentIndexState,
  isMiniplayerState,
  songListState,
  songPlaybackOrderState,
} from './Local';
import { currentSongIndexFunc } from './LocalFuncs';
import { maybeAlbumByKeyFuncFam, maybeArtistByKeyFuncFam } from './ReadOnly';

// const log = MakeLogger('ReadWrite');
// const err = MakeError('ReadWrite-err');

export const mutedState = atom<boolean>({
  key: 'mute',
  default: false,
  effects_UNSTABLE: [Effects.syncWithMain<boolean>()],
});

export const volumeState = atom<number>({
  key: 'volume',
  default: 0.5,
  effects_UNSTABLE: [Effects.syncWithMain<number>()],
});

const shuffleState = atom<boolean>({
  key: 'shuffle',
  default: false,
  effects_UNSTABLE: [Effects.syncWithMain<boolean>()],
});

export const shuffleFunc = selector<boolean>({
  key: 'shuffleFunc',
  get: ({ get }) => get(shuffleState),
  set: ({ get, set }, newVal) => {
    set(shuffleState, newVal === true);
    if (newVal !== true) {
      // update the currentIndex to the 'right' value when we clear the playback order
      const realIndex = get(currentSongIndexFunc);
      set(songPlaybackOrderState, 'ordered');
      set(currentIndexState, realIndex);
    } else {
      const curList = get(songListState);
      if (curList.length === 0) {
        set(songPlaybackOrderState, []);
      } else {
        // Even if we're setting it to true against an already
        // true state, go ahead & shuffle...
        let curIdx = get(currentIndexState);
        if (curIdx < 0) {
          // Nothing is currently playing: just shuffle the array and be done
          set(
            songPlaybackOrderState,
            ShuffleArray(Array.from(curList, (_, idx) => idx)),
          );
        } else {
          // We've got a "now playing"
          // Pull it out, and put it at the beginning
          const curOrd = get(songPlaybackOrderState);
          if (curOrd !== 'ordered') {
            curIdx = curOrd[curIdx];
          }
          // Make an array of 0 => length, minux curIdx
          const newOrder = Array.from(curList, (_, idx) =>
            idx >= curIdx ? idx + 1 : idx,
          );
          // Pop the back (length is 1 too high anyway!)
          newOrder.pop();
          // Push the current index at the beginning
          set(songPlaybackOrderState, [curIdx, ...ShuffleArray(newOrder)]);
          // And now set the playback to the first of the playback order
          set(currentIndexState, 0);
        }
      }
    }
  },
});

export const repeatState = atom<boolean>({
  key: 'repeat',
  default: false,
  effects_UNSTABLE: [Effects.syncWithMain<boolean>()],
});

// This is the 'locations' for searching
export const locationsState = atom<string[]>({
  key: 'locations',
  default: [],
  effects_UNSTABLE: [Effects.syncWithMain<string[]>()],
});

export const defaultLocationState = atom<string>({
  key: 'defaultLocation',
  default: '',
  effects_UNSTABLE: [Effects.syncWithMain<string>()],
});

// Sort with/without articles setting
export const ignoreArticlesState = atom<boolean>({
  key: 'rSortWithArticles',
  default: true,
  effects_UNSTABLE: [Effects.syncWithMain<boolean>()],
});

// Only show artists in the list who appear on full albums
export const showArtistsWithFullAlbumsState = atom<boolean>({
  key: 'FullAlbumsOnly',
  default: false,
  effects_UNSTABLE: [Effects.syncWithMain<boolean>()],
});

export const downloadAlbumArtworkState = atom({
  key: 'downloadAlbumArtwork',
  default: false,
  effects_UNSTABLE: [Effects.syncWithMain<boolean>()],
});

export const downloadArtistArtworkState = atom({
  key: 'downloadArtistArtwork',
  default: false,
  effects_UNSTABLE: [Effects.syncWithMain<boolean>()],
});

export const saveAlbumArtworkWithMusicState = atom({
  key: 'saveAlbumArtworkWithMusic',
  default: false,
  effects_UNSTABLE: [Effects.syncWithMain<boolean>()],
});

export const albumCoverNameState = atom({
  key: 'albumCoverName',
  default: '.CoverArt',
  effects_UNSTABLE: [Effects.syncWithMain<string>()],
});

// The minimum # of songs an artist needs to show up in the artist list
export const minSongCountForArtistListState = atom<number>({
  key: 'MinSongCount',
  default: 1,
  effects_UNSTABLE: [Effects.syncWithMain<number>()],
});

const curViewBackerState = atom<CurrentView>({
  key: 'CurrentView',
  default: CurrentView.settings,
  effects_UNSTABLE: [Effects.syncWithMain<CurrentView>()],
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

// const albumListSortState = atom<string>({
//   key: 'rAlbumListSort',
//   default: 'ry',
// });
// const artistListSortState = atom<string>({
//   key: 'rArtistListSort',
//   default: 'rl',
// });

export const songListSortState = atom<string>({
  key: 'rSongListSort',
  default: 'rl',
});

export const songListFromKeyFuncFam = selectorFamily<SongKey[] | null, string>({
  key: 'songsFromKey',
  get:
    (arg: string) =>
    ({ get }) => {
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
