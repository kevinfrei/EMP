import { SongKey } from '@freik/media-core';
import { atom } from 'recoil';
import { MakeSortKey } from '../Sorting';

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

export const playOrderDisplayingState = atom<boolean>({
  key: 'playOrderShowing',
  default: false,
});
