import { IDetailsList } from '@fluentui/react';
import {
  MakeError,
  MakeLogger,
  Pickle,
  Type,
  Unpickle,
} from '@freik/core-utils';
import { useEffect, useState } from 'react';
import {
  atom,
  AtomEffect,
  CallbackInterface,
  DefaultValue,
  RecoilState,
  selectorFamily,
  SerializableParam,
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
import { Fail, onRejected } from '../Tools';

export type StatePair<T> = [T, SetterOrUpdater<T>];

// [state, show (set true), hide (set false)]
export type BoolState = [boolean, () => void, () => void];

export type DialogData = [boolean, () => void];
// A simplifier for dialogs: [0] shows the dialog, [1] is used in the dialog
export type DialogState = [() => void, DialogData];

const log = MakeLogger('helpers');
const err = MakeError('helpers-err');

export function MakeSetSelector<T extends SerializableParam>(
  setOfObjsState: RecoilState<Set<T>>,
  key: string,
): (param: T) => RecoilState<boolean> {
  return selectorFamily<boolean, T>({
    key,
    get:
      (item: T) =>
      ({ get }) =>
        get(setOfObjsState).has(item),
    set:
      (item: T) =>
      ({ set }, newValue) =>
        set(setOfObjsState, (prevVal: Set<T>) => {
          const newSet = new Set<T>(prevVal);
          if (newValue) {
            newSet.delete(item);
          } else {
            newSet.add(item);
          }
          return newSet;
        }),
  });
}

export function MakeSetState<T extends SerializableParam>(
  key: string,
  //  from: RecoilState<Iterable<T>>
): [RecoilState<Set<T>>, (param: T) => RecoilState<boolean>] {
  const theAtom = atom({ key, default: new Set<T>() });
  return [theAtom, MakeSetSelector(theAtom, key + ':sel')];
}

/**
 * A short cut for on/off states to make some things (like dialogs) cleaner
 *
 * @returns {BoolState} [state, trueSetter(), falseSetter()]
 */
export function useBoolState(initial: boolean): BoolState {
  const [state, setState] = useState(initial);
  return [state, () => setState(false), () => setState(true)];
}

export function useBoolRecoilState(theAtom: RecoilState<boolean>): BoolState {
  const [state, setState] = useRecoilState(theAtom);
  return [state, () => setState(false), () => setState(true)];
}

export function useDialogState(): DialogState {
  const [isHidden, setHidden] = useState(true);
  return [() => setHidden(false), [isHidden, () => setHidden(true)]];
}

export function useListener(
  message: string,
  listener: (args: unknown) => void,
): void {
  useEffect(() => {
    const subKey = Subscribe(message, listener);
    return () => Unsubscribe(subKey);
  });
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

export function oneWayFromMainEffect<T>(
  get: () => T | Promise<T>,
  asyncKey: string,
  asyncHandler: (data: any) => T | undefined,
): AtomEffect<T>;

export function oneWayFromMainEffect<T>(
  get: () => T | Promise<T>,
): AtomEffect<T>;

export function oneWayFromMainEffect<T>(
  get: () => T | Promise<T>,
  asyncKey?: string,
  asyncHandler?: (data: any) => T | undefined,
): AtomEffect<T> {
  return ({
    node,
    trigger,
    setSelf,
    onSet,
  }: AtomEffectParams<T>): (() => void) | void => {
    if (trigger === 'get') {
      const res = get();
      if (!Type.isPromise(res)) {
        setSelf(res);
      } else {
        res
          .then(setSelf)
          .catch(onRejected(`${node.key} Get failed in oneWayFromMain`));
      }
    }
    let lKey: ListenKey | null = null;
    if (asyncKey && asyncHandler) {
      lKey = Subscribe(asyncKey, (val: unknown) => {
        const theRightType = asyncHandler(val);
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
      Fail(`Invalid assignment to server-side-only atom ${node.key}`);
    });
    if (asyncKey) {
      return () => {
        if (lKey) {
          log(`Unsubscribing listener for ${asyncKey}`);
          Unsubscribe(lKey);
        }
      };
    }
  };
}

/**
 * An Atom effect to acquire the value from main, and save it back when
 * modified, after processing it from the original type to JSON using Pickling.
 *
 * @param {boolean} asyncUpdates
 * Optionally true if you also need to actively respond to server changes
 *
 * @returns an AtomEffect<T>
 */
export function bidirectionalSyncWithTranslateEffect<T>(
  toPickleable: (val: T) => unknown,
  fromUnpickled: (val: unknown) => T | void,
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
            const data = fromUnpickled(Unpickle(value));
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
      lKey = Subscribe(node.key, (val: unknown) => {
        const theRightType = fromUnpickled(val);
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
      const newPickled = Pickle(toPickleable(newVal));
      if (
        oldVal instanceof DefaultValue ||
        Pickle(toPickleable(oldVal)) !== newPickled
      ) {
        log(`Saving ${node.key} back to server...`);
        WriteToStorage(node.key, newPickled)
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
    (a) => a as unknown,
    (a) => a as T,
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
  return ({ set }: CallbackInterface) =>
    (ev: T) => {
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
  return ({ set }: CallbackInterface) =>
    (ev: T): void => {
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
