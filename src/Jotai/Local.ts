import { SongKey } from '@freik/media-core';
import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { MakeSortKey } from '../Sorting';

export const isMiniplayerState = atom(false);

// This is the sort for the current playlist
export const nowPlayingSortState = atomWithReset(MakeSortKey([''], ['lyrnt']));

// The currently selected song(s) to display details for
export const songDetailState = atomWithReset<Set<SongKey>>(new Set<SongKey>());

// The # of recently added songs to show for a few seconds
export const recentlyQueuedState = atomWithReset<number>(0);

// Is the 'display message' showing
export const displayMessageState = atom<boolean>(false);

// Are we displaying the play order?
export const playOrderDisplayingState = atom<boolean>(false);
