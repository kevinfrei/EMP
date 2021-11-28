import { AlbumKey, ArtistKey, MediaKey, SongKey } from '@freik/media-core';
import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import { MakeSortKey } from '../Sorting';
import { RandomInt } from '../Tools';
import { CurrentView, curViewFunc, repeatState } from './ReadWrite';

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

// The order of the playlist to play
export const songPlaybackOrderState = atom<'ordered' | number[]>({
  key: 'playbackOrder',
  default: 'ordered',
});

// The position in the active playlist of the current song
// For 'ordered' playback, it's the index in the songList
// otherwise it's an index into the songPlaybackOrderState
export const currentIndexState = atom<number>({
  key: 'currentIndex',
  default: -1,
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

// This is the sort for the current playlist
export const nowPlayingSortState = atom({
  key: 'nowPlayingSort',
  default: MakeSortKey([''], ['lyrnt']),
});

// The currently selected song(s) to display details for
export const songDetailState = atom<Set<SongKey>>({
  key: 'songDetail',
  default: new Set(),
});

// The # of recently added songs to show for a few seconds
export const recentlyQueuedState = atom<number>({
  key: 'recentlyQueued',
  default: 0,
});

export const displayMessageState = atom<boolean>({
  key: 'displayMessage',
  default: false,
});

export const isMiniplayerState = atom<boolean>({
  key: 'isMiniplayer',
  default: false,
});

/* This stuff is to make it so that pic URL's will refresh, when we update
 * the "picCacheAvoider" for a particularly album cover
 * It's efficacy is not guaranteed, but it's a best effort, i guess
 */
export const picCacheAvoiderStateFam = atomFamily<number, MediaKey>({
  key: 'picCacheAvoider',
  default: RandomInt(0x3fffffff),
});

export const albumCoverUrlFuncFam = selectorFamily<string, AlbumKey>({
  key: 'albumCoverUrl',
  get: (key: AlbumKey) => ({ get }) => {
    return `pic://key/${key}`;
  },
});

export const artistImageUrlFuncFam = selectorFamily<string, ArtistKey>({
  key: 'artistImageUrl',
  get: (key: ArtistKey) => ({ get }) => {
    return `pic://key/${key}`;
  },
});

// This is the currently 'typed' set of characters (for scrolling lists)
export const keyBufferState = atom<string>({ key: 'KeyBuffer', default: '' });

export const focusedKeysFuncFam = selectorFamily<string, CurrentView>({
  key: 'focusedKeys',
  get: (view: CurrentView) => ({ get }) => {
    return get(curViewFunc) === view ? get(keyBufferState) : '';
  },
});
