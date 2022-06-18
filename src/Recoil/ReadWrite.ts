/* eslint-disable @typescript-eslint/naming-convention */
import { Effects } from '@freik/elect-render-utils';
import { isAlbumKey, isArtistKey, isSongKey, SongKey } from '@freik/media-core';
import { atom, selector, selectorFamily } from 'recoil';
import { CurrentView } from 'shared';
import { ShuffleArray } from '../Tools';
import { isMiniplayerState } from './Local';
import { maybeAlbumByKeyFuncFam, maybeArtistByKeyFuncFam } from './ReadOnly';
import {
  currentIndexState,
  currentSongIndexFunc,
  songListState,
  songPlaybackOrderState,
} from './SongPlaying';

// const log = MakeLogger('ReadWrite');
// const err = MakeError('ReadWrite-err');

export const mutedState = atom<boolean>({
  key: 'mute',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});

export const volumeState = atom<number>({
  key: 'volume',
  default: 0.5,
  effects: [Effects.syncWithMain<number>()],
});

const shuffleState = atom<boolean>({
  key: 'shuffle',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});

// This handles dealing with the playback order along with the state change
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
  effects: [Effects.syncWithMain<boolean>()],
});

// This is the 'locations' for searching for tunes
export const locationsState = atom<string[]>({
  key: 'locations',
  default: [],
  effects: [Effects.syncWithMain<string[]>()],
});

export const defaultLocationState = atom<string>({
  key: 'defaultLocation',
  default: '',
  effects: [Effects.syncWithMain<string>()],
});

// Sort with/without articles setting
export const ignoreArticlesState = atom<boolean>({
  key: 'rSortWithArticles',
  default: true,
  effects: [Effects.syncWithMain<boolean>()],
});

// Only show artists in the list who appear on full albums
export const showArtistsWithFullAlbumsState = atom<boolean>({
  key: 'FullAlbumsOnly',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});

export const downloadAlbumArtworkState = atom({
  key: 'downloadAlbumArtwork',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});

export const downloadArtistArtworkState = atom({
  key: 'downloadArtistArtwork',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});

export const saveAlbumArtworkWithMusicState = atom({
  key: 'saveAlbumArtworkWithMusic',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});

export const albumCoverNameState = atom({
  key: 'albumCoverName',
  default: '.CoverArt',
  effects: [Effects.syncWithMain<string>()],
});

// The minimum # of songs an artist needs to show up in the artist list
export const minSongCountForArtistListState = atom<number>({
  key: 'MinSongCount',
  default: 1,
  effects: [Effects.syncWithMain<number>()],
});

// The currently selected item from the left bar
// artist, album, search, tools, settings, etc...
const curViewBackerState = atom<CurrentView>({
  key: 'CurrentView',
  default: CurrentView.settings,
  effects: [Effects.syncWithMain<CurrentView>()],
});

// This makes the miniplayer view always select the current view
export const curViewFunc = selector<CurrentView>({
  key: 'CurViewWithMiniplayerAwareness',
  get: ({ get }) =>
    get(isMiniplayerState) ? CurrentView.now_playing : get(curViewBackerState),
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
      if (isSongKey('S')) {
        return [arg];
      }
      if (isAlbumKey('L')) {
        const alb = get(maybeAlbumByKeyFuncFam(arg));
        return !alb ? null : alb.songs;
      }
      if (isArtistKey('R')) {
        const art = get(maybeArtistByKeyFuncFam(arg));
        return !art ? null : art.songs;
      }
      return null;
    },
});
