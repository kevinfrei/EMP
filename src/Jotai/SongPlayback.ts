import { isSongKey, SongKey } from '@freik/media-core';
import {
  chkArrayOf,
  chkOneOf,
  isBoolean,
  isNumber,
  isString,
} from '@freik/typechk';
import { atom } from 'jotai';
import { atomWithMainStorage } from './Storage';

export const shuffleState = atomWithMainStorage('shuffle', false, isBoolean);

export const repeatState = atomWithMainStorage('repeat', false, isBoolean);

// The position in the active playlist of the current song
// For 'ordered' playback, it's the index in the songList
// otherwise it's an index into the songPlaybackOrderState
export const currentIndexState = atomWithMainStorage(
  'currentIndex',
  -1,
  isNumber,
);

// The order of the playlist to play
export const songPlaybackOrderState = atomWithMainStorage<'ordered' | number[]>(
  'playbackOrder',
  'ordered',
  chkOneOf((a): a is 'ordered' => a === 'ordered', chkArrayOf(isNumber)),
);

// The name of the active playlist
// the emptry string means the playlist isn't saved as, or based on, anything
export const activePlaylistState = atomWithMainStorage(
  'nowPlaying',
  '',
  isString,
);

// The currently active playlist
export const songListState = atomWithMainStorage<SongKey[]>(
  'currentSongList',
  [],
  chkArrayOf(isSongKey),
);

// This is the current index into the nowPlayist (sorted, never shuffled) list
export const currentSongIndexState = atom(
  async (get) => {
    const curIdx = await get(currentIndexState);
    if (curIdx < 0) {
      return curIdx;
    }
    const order = await get(songPlaybackOrderState);
    if (order === 'ordered') {
      return curIdx;
    }
    return order[curIdx];
  },
  async (get, set, newVal: number) => {
    const order = await get(songPlaybackOrderState);
    if (order === 'ordered') {
      set(currentIndexState, newVal);
    } else if (isNumber(newVal)) {
      set(currentIndexState, order.indexOf(newVal));
    } else {
      set(currentIndexState, -1);
    }
  },
);

// Selector to get the current song key based on the rest of this nonsense
export const currentSongKeyState = atom(async (get) => {
  const curIndex = await get(currentIndexState);
  if (curIndex >= 0) {
    const songList = await get(songListState);
    const playbackOrder = await get(songPlaybackOrderState);
    if (curIndex >= 0 && curIndex < songList.length) {
      return playbackOrder === 'ordered'
        ? songList[curIndex]
        : songList[playbackOrder[curIndex]];
    }
  }
  return '';
});

// Is there a 'next song' to play?
export const hasNextSongState = atom(async (get) => {
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
export const hasPrevSongState = atom(async (get) => {
  const songList = await get(songListState);
  if (songList.length === 0) {
    return false;
  }
  const curIndex = await get(currentIndexState);
  return curIndex > 0 || (await get(repeatState));
});

// Do we have any songs at all?
export const hasAnySongsState = atom(
  async (get) => (await get(songListState)).length > 0,
);
