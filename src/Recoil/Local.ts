import { Song, SongKey } from '@freik/core-utils';
import { atom, selector } from 'recoil';
import { repeatState } from './ReadWrite';

export type PlaylistName = string;

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

// The position in the active playlist of the current song
export const currentIndexState = atom<number>({
  key: 'currentIndex',
  default: -1,
});

// Selector to get the current song key based on the rest of this nonsense
export const currentSongKeyState = selector<SongKey>({
  key: 'currentSongKey',
  get: ({ get }) => {
    const curIndex = get(currentIndexState);
    if (curIndex >= 0) {
      const songList = get(songListState);
      if (curIndex >= 0 && curIndex < songList.length) {
        return songList[curIndex];
      }
    }
    return '';
  },
});

// Is there a 'next song' to play?
export const hasNextSongState = selector<boolean>({
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
export const hasPrevSongState = selector<boolean>({
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
export const hasAnySongsState = selector<boolean>({
  key: 'hasAnySongs',
  get: ({ get }) => get(songListState).length > 0,
});

// This is the sort for the current playlist
export const nowPlayingSortState = atom<string>({
  key: 'nowPlayingSort',
  default: '',
});

// The currently selected song to display details for
export const songDetailState = atom<Song | null>({
  key: 'songDetail',
  default: null,
});
