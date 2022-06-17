import { Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-core';
import { atom, selector } from 'recoil';
import { repeatState } from './ReadWrite';

// The position in the active playlist of the current song
// For 'ordered' playback, it's the index in the songList
// otherwise it's an index into the songPlaybackOrderState
export const currentIndexState = atom<number>({
  key: 'currentIndex',
  default: -1,
});

// The order of the playlist to play
export const songPlaybackOrderState = atom<'ordered' | number[]>({
  key: 'playbackOrder',
  default: 'ordered',
});

// The name of the active playlist
// the emptry string means the playlist isn't saved as, or based on, anything
export const activePlaylistState = atom<string>({
  key: 'nowPlaying',
  default: '',
});

// The currently active playlist
export const songListState = atom<SongKey[]>({
  key: 'currentSongList',
  default: [],
});

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
