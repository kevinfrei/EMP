import { CurrentView } from '@freik/emp-shared';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { curViewFunc } from './CurrentView';

// This is the currently 'typed' set of characters (for scrolling lists)
export const keyBufferState = atom('');

export const focusedKeysFuncFam = atomFamily((view: CurrentView) =>
  atom((get) => (get(curViewFunc) === view ? get(keyBufferState) : '')),
);
