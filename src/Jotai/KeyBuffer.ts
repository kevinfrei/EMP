import { CurrentViewEnum } from '@freik/emp-shared';
import { Atom, atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { curViewFunc } from './CurrentView';

// This is the currently 'typed' set of characters (for scrolling lists)
export const keyBufferState = atom('');

export const focusedKeysFuncFam = atomFamily<CurrentViewEnum, Atom<string>>(
  (view) =>
    atom<string>((get) =>
      get(curViewFunc) === view ? get(keyBufferState) : '',
    ),
);
