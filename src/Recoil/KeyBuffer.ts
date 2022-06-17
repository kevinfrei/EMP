import { atom, selectorFamily } from 'recoil';
import { CurrentView } from 'shared';
import { curViewFunc } from './ReadWrite';

// This is the currently 'typed' set of characters (for scrolling lists)
export const keyBufferState = atom<string>({ key: 'KeyBuffer', default: '' });

export const focusedKeysFuncFam = selectorFamily<string, CurrentView>({
  key: 'focusedKeys',
  get:
    (view: CurrentView) =>
    ({ get }) => {
      return get(curViewFunc) === view ? get(keyBufferState) : '';
    },
});
