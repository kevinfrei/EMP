import { IDetailsList } from '@fluentui/react';
import { FTON, FTONData, MakeError, MakeLogger } from '@freik/core-utils';
import { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import {
  AtomEffect,
  CallbackInterface,
  DefaultValue,
  RecoilState,
  SetterOrUpdater,
  useRecoilState,
} from 'recoil';
import {
  ListenKey,
  ReadFromStorage,
  Subscribe,
  Unsubscribe,
  WriteToStorage,
} from '../ipc';
import { onRejected } from '../Tools';

export type StatePair<T> = [T, SetterOrUpdater<T>];

// [state, show (set true), hide (set false)]
export type BoolState = [boolean, () => void, () => void];

export type DialogData = [boolean, () => void];
// A simplifier for dialogs: [0] shows the dialog, [1] is used in the dialog
export type DialogState = [() => void, DialogData];

const log = MakeLogger('helpers');
const err = MakeError('helpers-err');

/**
 * A short cut for on/off states to make some things (like dialogs) cleaner
 *
 * @returns {BoolState} [state, trueSetter(), falseSetter()]
 */
export function useBoolState(initial: boolean): BoolState {
  const [state, setState] = useState(initial);
  return [state, () => setState(false), () => setState(true)];
}

export function useBoolRecoilState(atom: RecoilState<boolean>): BoolState {
  const [state, setState] = useRecoilState(atom);
  return [state, () => setState(false), () => setState(true)];
}

export function useDialogState(): DialogState {
  const [isHidden, setHidden] = useState(true);
  return [() => setHidden(false), [isHidden, () => setHidden(true)]];
}

export type AtomEffectParams<T> = {
  node: RecoilState<T>;
  trigger: 'get' | 'set';
  // Callbacks to set or reset the value of the atom.
  // This can be called from the atom effect function directly to initialize the
  // initial value of the atom, or asynchronously called later to change it.
  setSelf: (
    newVal:
      | T
      | DefaultValue
      | Promise<T | DefaultValue> // Only allowed for initialization at this time
      | ((curVal: T | DefaultValue) => T | DefaultValue),
  ) => void;
  resetSelf: () => void;

  // Subscribe to changes in the atom value.
  // The callback is not called due to changes from this effect's own setSelf().
  onSet: (
    func: (newValue: T | DefaultValue, oldValue: T | DefaultValue) => void,
  ) => void;
};

export function translateToMainEffect<T>(
  toString: (input: T) => string,
  fromString: (input: string) => T | void,
) {
  return ({ node, trigger, setSelf, onSet }: AtomEffectParams<T>): void => {
    if (trigger === 'get') {
      ReadFromStorage(node.key)
        .then((value) => {
          if (value) {
            const data = fromString(value);
            if (data) {
              setSelf(data);
            }
          }
        })
        .catch(onRejected(`${node.key} Get failed in translateToMainEffect`));
    }
    onSet((newVal, oldVal) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      const newStr = toString(newVal);
      if (oldVal instanceof DefaultValue || newStr !== toString(oldVal)) {
        WriteToStorage(node.key, newStr).catch(
          onRejected(`${node.key} save to main failed`),
        );
      }
    });
  };
}

/**
 * An Atom effect to acquire the value from main, and save it back when
 * modified, after processing it from the original type to FTON (JSON).
 *
 * @param {(val: T) => FTONData} toFton
 * The function to convert T to FTON data
 * @param {(val: FTONData) => T | void} fromFton
 * The funciton to convert FTON data to T or void if it's malformed
 * @param {boolean} asyncUpdates
 * Optionally true if you also need to actively respond to server changes
 *
 * @returns an AtomEffect<T>
 */
export function bidirectionalSyncWithTranslateEffect<T>(
  toFton: (val: T) => FTONData,
  fromFton: (val: FTONData) => T | void,
  asyncUpdates?: boolean,
): AtomEffect<T> {
  return ({
    node,
    trigger,
    setSelf,
    onSet,
  }: AtomEffectParams<T>): (() => void) | void => {
    if (trigger === 'get') {
      log(`Get trigger for ${node.key}`);
      ReadFromStorage(node.key)
        .then((value) => {
          log(`Got a value from the server for ${node.key}`);
          if (value) {
            log(value);
            log('***');
            const data = fromFton(FTON.parse(value));
            log(data);
            if (data) {
              log(`Setting Self for ${node.key}`);
              setSelf(data);
            }
          }
        })
        .catch(onRejected(`${node.key} Get failed in bidirectional sync`));
    }
    let lKey: ListenKey | null = null;
    if (asyncUpdates) {
      lKey = Subscribe(node.key, (val: FTONData) => {
        const theRightType = fromFton(val);
        if (theRightType) {
          log(`Async data for ${node.key}:`);
          log(theRightType);
          setSelf(theRightType);
        } else {
          err(`Async invalid data received for ${node.key}:`);
          err(val);
        }
      });
    }
    onSet((newVal, oldVal) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      const newFton = toFton(newVal);
      if (
        oldVal instanceof DefaultValue ||
        !FTON.valEqual(toFton(oldVal), newFton)
      ) {
        log(`Saving ${node.key} back to server...`);
        WriteToStorage(node.key, FTON.stringify(newFton))
          .then(() => log(`${node.key} saved properly`))
          .catch(onRejected(`${node.key} save to main failed`));
      }
    });

    if (asyncUpdates) {
      return () => {
        if (lKey) {
          log(`Unsubscribing listener for ${node.key}`);
          Unsubscribe(lKey);
        }
      };
    }
  };
}

export function syncWithMainEffect<T>(asyncUpdates?: boolean): AtomEffect<T> {
  return bidirectionalSyncWithTranslateEffect<T>(
    (a) => (a as unknown) as FTONData,
    (b) => (b as unknown) as T,
    asyncUpdates,
  );
}

/*
To get off of the AtomEffects API, I need three things:
1. a 'get' mechanism to initialize backing atoms
2. a 'set' mechanism to send data back to the server when it's changed (for RW atoms)
3. an async update mechanism to update backing atoms

#1 can be accomplished by using a helper component with an effect to pull the value
from the server, and store it back to the backing atom

#2 should just work with selectors, no magic involved, really

#3 can be in the same helper component for #1
*/

// Initial value 'getter' effect:
// for each atom that's registered, queue up a query to load the initial value
// Set up handlers so that those values update the backing atoms

const registeredAtoms: RecoilState<unknown>[] = [];

export function getAtomValuesEffect(): void {
  for (const theAtom of registeredAtoms) {
    log('Registered Atom:');
    log(theAtom);
  }
}

interface KeyEventType {
  key: string;
}

type KeyboardHookType<T extends KeyEventType> = (
  cbIntfc: CallbackInterface,
) => (ev: T) => void;

let lastHeard = performance.now();

export function keyboardHook<T extends KeyEventType>(
  filterState: RecoilState<string>,
): KeyboardHookType<T> {
  return ({ set }: CallbackInterface) => (ev: T) => {
    err(ev.key);
    if (ev.key.length > 1 || ev.key === ' ') {
      set(filterState, '');
      return;
    }
    const time = performance.now();
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
  return ({ set }: CallbackInterface) => (ev: T): void => {
    if (ev.key.length > 1 || ev.key === ' ') {
      set(filterState, '');
      return;
    }
    const time = performance.now();
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
