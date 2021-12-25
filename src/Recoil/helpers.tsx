import { IDetailsList } from '@fluentui/react';
import { MakeError } from '@freik/core-utils';
import { CallbackInterface, RecoilState } from 'recoil';

const err = MakeError('helpers-err');

interface KeyEventType {
  key: string;
}

type KeyboardHookType<T extends KeyEventType> = (
  cbIntfc: CallbackInterface,
) => (ev: T) => void;

let lastHeard = new Date().getTime();

export function keyboardHook<T extends KeyEventType>(
  filterState: RecoilState<string>,
): KeyboardHookType<T> {
  return ({ set }: CallbackInterface) =>
    (ev: T) => {
      err(ev.key);
      if (ev.key.length > 1 || ev.key === ' ') {
        set(filterState, '');
        return;
      }
      const time = new Date().getTime();
      const clear: boolean = time - lastHeard > 750;
      lastHeard = time;
      set(filterState, (curVal) => (clear ? ev.key : curVal + ev.key));
    };
}

export function kbHook<T extends KeyEventType>(
  filterState: RecoilState<string>,
  listRef: IDetailsList | null,
  shouldFocus: () => boolean,
  getIndex: (srch: string) => number,
) {
  return ({ set }: CallbackInterface) =>
    (ev: T): void => {
      if (ev.key.length > 1 || ev.key === ' ') {
        set(filterState, '');
        return;
      }
      const time = new Date().getTime();
      const clear: boolean = time - lastHeard > 750;
      lastHeard = time;
      // const newFilter = clear ? ev.key : keyFilter + ev.key;
      set(filterState, (oldVal): string => {
        const srchString = clear ? ev.key : oldVal + ev.key;
        if (shouldFocus() && listRef !== null && srchString.length > 0) {
          const index = getIndex(srchString);
          listRef.focusIndex(index);
        }
        return srchString;
      });
    };
}
