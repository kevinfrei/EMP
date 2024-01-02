import { isSongKey } from '@freik/media-core';
import {
  chkArrayOf,
  chkOneOf,
  isNumber,
  isString,
  typecheck,
} from '@freik/typechk';
import { atom } from 'jotai';
import { RESET } from 'jotai/utils';
import { isPromise } from 'util/types';
import { repeatState } from './SimpleSettings';
import { atomWithMainStorage } from './Storage';

// The position in the active playlist of the current song
// For 'ordered' playback, it's the index in the songList
// otherwise it's an index into the songPlaybackOrderState
export const currentIndexState = atomWithMainStorage(
  'currentIndex',
  -1,
  isNumber,
);

const isOrdered: typecheck<'ordered'> = (a): a is 'ordered' => a === 'ordered';

// The order of the playlist to play
export const songPlaybackOrderState = atomWithMainStorage(
  'playbackOrder',
  'ordered',
  chkOneOf(isOrdered, chkArrayOf(isNumber)),
);

// The name of the active playlist
// the emptry string means the playlist isn't saved as, or based on, anything
export const activePlaylistState = atomWithMainStorage(
  'nowPlaying',
  '',
  isString,
);

// The currently active playlist
export const songListState = atomWithMainStorage(
  'currentSongList',
  [],
  chkArrayOf(isSongKey),
);

// This is the current index into the nowPlayist (sorted, never shuffled) list
export const currentSongIndexFunc = atom(
  async (get) => {
    const curIdx = await get(currentIndexState);
    if (curIdx < 0) {
      return curIdx;
    }
    const order = await get(songPlaybackOrderState);
    if (isOrdered(order)) {
      return curIdx;
    }
    return order[curIdx];
  },
  async (get, set, newVal: number | Promise<number> | typeof RESET) => {
    const order = await get(songPlaybackOrderState);
    if (isOrdered(order)) {
      await set(currentIndexState, await newVal);
    } else if (isNumber(newVal) || isPromise(newVal)) {
      await set(currentIndexState, order.indexOf(await newVal));
    } else {
      await set(currentIndexState, -1);
    }
  },
);

// Selector to get the current song key based on the rest of this nonsense
export const currentSongKeyFunc = atom(async (get) => {
  const curIndex = await get(currentIndexState);
  if (curIndex >= 0) {
    const songList = await get(songListState);
    const playbackOrder = await get(songPlaybackOrderState);
    if (curIndex >= 0 && curIndex < songList.length) {
      return isOrdered(playbackOrder)
        ? songList[curIndex]
        : songList[playbackOrder[curIndex]];
    }
  }
  return '';
});

// Is there a 'next song' to play?
export const hasNextSongFunc = atom(async (get) => {
  const songList = await get(songListState);
  if (songList.length === 0) {
    return false;
  }
  const curIndex = await get(currentIndexState);
  if (curIndex >= 0 && curIndex < songList.length - 1) {
    return true;
  }
  return get(repeatState);
});

// Is there a 'previous song' to play?
export const hasPrevSongFunc = atom(async (get) => {
  const songList = await get(songListState);
  if (songList.length === 0) {
    return false;
  }
  const curIndex = await get(currentIndexState);
  return curIndex > 0 || get(repeatState);
});

// Do we have any songs at all?
export const hasAnySongsFunc = atom(
  async (get) => (await get(songListState)).length > 0,
);
