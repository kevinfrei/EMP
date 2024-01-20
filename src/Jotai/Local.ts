import { SongKey } from '@freik/media-core';
import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { MakeSortKey } from '../Sorting';

export const isMiniplayerAtom = atom(false);

// This is the sort for the current playlist
export const nowPlayingSortAtom = atomWithReset(MakeSortKey([''], ['lyrnt']));

// The currently selected song(s) to display details for
export const songDetailAtom = atomWithReset(new Set<SongKey>());

// The # of recently added songs to show for a few seconds
export const recentlyQueuedAtom = atomWithReset(0);

// Is the 'display message' showing
export const displayMessageAtom = atom(false);

// Are we displaying the play order?
export const playOrderDisplayingAtom = atom(false);
