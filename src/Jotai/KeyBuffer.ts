import { CurrentView } from '@freik/emp-shared';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { curViewAtom } from './CurrentView';

// This is the currently 'typed' set of characters (for scrolling lists)
export const keyBufferAtom = atom('');

export const focusedKeysAtomFam = atomFamily((view: CurrentView) =>
  atom((get) => (get(curViewAtom) === view ? get(keyBufferAtom) : '')),
);
