import { FTON, FTONData, MakeLogger } from '@freik/core-utils';
import { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { AtomEffect, DefaultValue, RecoilState, SetterOrUpdater } from 'recoil';
import {
  GetGeneral,
  ListenKey,
  SetGeneral,
  Subscribe,
  Unsubscribe,
} from '../ipc';

export type StatePair<T> = [T, SetterOrUpdater<T>];

// [state, show (set true), hide (set false)]
export type BoolState = [boolean, () => void, () => void];

export type DialogData = [boolean, () => void];
// A simplifier for dialogs: [0] shows the dialog, [1] is used in the dialog
export type DialogState = [() => void, DialogData];

const log = MakeLogger('helpers', true);
const err = MakeLogger('helpers-err', true);

/**
 * A short cut for on/off states to make some things (like dialogs) cleaner
 *
 * @returns {BoolState} [state, trueSetter(), falseSetter()]
 */
export function useBoolState(initial: boolean): BoolState {
  const [dialogState, setDialogState] = useState(initial);
  return [dialogState, () => setDialogState(false), () => setDialogState(true)];
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
      GetGeneral(node.key)
        .then((value) => {
          if (value) {
            const data = fromString(value);
            if (data) {
              setSelf(data);
            }
          }
        })
        .catch((rej) => log(`${node.key} Get failed`));
    }
    onSet((newVal, oldVal) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      const newStr = toString(newVal);
      if (oldVal instanceof DefaultValue || newStr !== toString(oldVal))
        SetGeneral(node.key, newStr).catch((reason) => {
          log(`${node.key} save to main failed`);
        });
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
      GetGeneral(node.key)
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
        .catch((rej) => err(`${node.key} Get failed`));
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
        SetGeneral(node.key, FTON.stringify(newFton))
          .then(() => log(`${node.key} saved properly`))
          .catch((reason) => err(`${node.key} save to main failed`));
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
