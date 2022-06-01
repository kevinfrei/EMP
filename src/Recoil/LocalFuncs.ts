import { Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-core';
import { selector, selectorFamily } from 'recoil';
import { CurrentView } from 'shared';
import {
  currentIndexState,
  keyBufferState,
  songListState,
  songPlaybackOrderState,
} from './Local';
import { curViewFunc, repeatState } from './ReadWrite';

// This is the current index into the nowPlayist (sorted, never shuffled) list
export const currentSongIndexFunc = selector<number>({
  key: 'currentSongIndex-really',
  get: ({ get }) => {
    const curIdx = get(currentIndexState);
    if (curIdx < 0) {
      return curIdx;
    }
    const order = get(songPlaybackOrderState);
    if (order === 'ordered') {
      return curIdx;
    }
    return order[curIdx];
  },
  set: ({ get, set }, newVal) => {
    const order = get(songPlaybackOrderState);
    if (order === 'ordered') {
      set(currentIndexState, newVal);
    } else if (Type.isNumber(newVal)) {
      set(currentIndexState, order.indexOf(newVal));
    } else {
      set(currentIndexState, -1);
    }
  },
});

// Selector to get the current song key based on the rest of this nonsense
export const currentSongKeyFunc = selector<SongKey>({
  key: 'currentSongKey',
  get: ({ get }) => {
    const curIndex = get(currentIndexState);
    if (curIndex >= 0) {
      const songList = get(songListState);
      const playbackOrder = get(songPlaybackOrderState);
      if (curIndex >= 0 && curIndex < songList.length) {
        return playbackOrder === 'ordered'
          ? songList[curIndex]
          : songList[playbackOrder[curIndex]];
      }
    }
    return '';
  },
});

// Is there a 'next song' to play?
export const hasNextSongFunc = selector<boolean>({
  key: 'hasNextSong',
  get: ({ get }) => {
    const songList = get(songListState);
    if (songList.length === 0) {
      return false;
    }
    const curIndex = get(currentIndexState);
    if (curIndex >= 0 && curIndex < songList.length - 1) {
      return true;
    }
    return get(repeatState);
  },
});

// Is there a 'previous song' to play?
export const hasPrevSongFunc = selector<boolean>({
  key: 'hasPrevSong',
  get: ({ get }) => {
    const songList = get(songListState);
    if (songList.length === 0) {
      return false;
    }
    const curIndex = get(currentIndexState);
    return curIndex > 0 || get(repeatState);
  },
});

// Do we have any songs at all?
export const hasAnySongsFunc = selector<boolean>({
  key: 'hasAnySongs',
  get: ({ get }) => get(songListState).length > 0,
});

export const focusedKeysFuncFam = selectorFamily<string, CurrentView>({
  key: 'focusedKeys',
  get:
    (view: CurrentView) =>
    ({ get }) => {
      return get(curViewFunc) === view ? get(keyBufferState) : '';
    },
});
