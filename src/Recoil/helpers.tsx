import { FTON, FTONData, MakeLogger } from '@freik/core-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import {
  atomFamily,
  DefaultValue,
  RecoilState,
  RecoilValue,
  selectorFamily,
  SetterOrUpdater,
  Snapshot,
  useRecoilState,
  useRecoilTransactionObserver_UNSTABLE,
  useRecoilValue,
} from 'recoil';
import { GetGeneral, SetGeneral } from '../ipc';

export type StatePair<T> = [T, SetterOrUpdater<T>];

// [state, show (set true), hide (set false)]
export type BoolState = [boolean, () => void, () => void];

export type DialogData = [boolean, () => void];
// A simplifier for dialogs: [0] shows the dialog, [1] is used in the dialog
export type DialogState = [() => void, DialogData];

const log = MakeLogger('helpers');

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

/**
 * An Atom effect to acquire the value from main, and save it back when
 * modified.
 *
 * If you're looking for something that will also allow asynchronous changes
 * from main to be reflected, @see bidirectionalSyncWithMainEffect instead
 */
export function reflectInMainEffect({
  node,
  trigger,
  setSelf,
  onSet,
}: AtomEffectParams<string>): void {
  if (trigger === 'get') {
    GetGeneral(node.key)
      .then((value) => {
        if (value) {
          setSelf(value);
        }
      })
      .catch((rej) => log(`${node.key} Get failed`));
  }
  onSet((newVal, oldVal) => {
    if (newVal !== oldVal && !(newVal instanceof DefaultValue))
      SetGeneral(node.key, newVal).catch((reason) => {
        log(`${node.key} save to main failed`);
      });
  });
}

export const translateToMainEffect = function <T>(
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
};
// This is the list of atoms that we're sync'ing back to the main process
const atomsToSync = new Map<string, RecoilState<unknown>>();

/**
 * This is a selector to acquire a particular value from the server.
 * Any values wind up being "read once" and the actual atom winds up containing
 * the current server value. This *does not work* for server-originating
 * changes!!!
 */
export const backerSelFamily = selectorFamily({
  key: 'backer-sync',
  get: (param: string) => async (): Promise<string> => {
    const serverVal = await GetGeneral(param);
    return serverVal || '';
  },
});

export const alreadyReadFamily = atomFamily({
  key: 'already-read',
  default: false,
});

/**
 * This will trigger a server side pull of the initial value, then use local
 * state for all subsequent sets. This must be used in tandem with the
 * PersistenceObserver transaction watcher and the syncAtom maker
 *
 * This has some problems if used at the same time, the two setters might
 * conflict. I should try to fix that...
 */
export function useBackedState<T>(theAtom: RecoilState<T>): StatePair<T> {
  // A little 'local' state
  const [alreadyRead, setAlreadyRead] = useRecoilState(
    alreadyReadFamily(theAtom.key),
  );
  // The 'backed' atom access
  const [atomValue, setAtomValue] = useRecoilState<T>(theAtom);
  // Pull the initial value from the server
  const selector = useRecoilValue<string>(backerSelFamily(theAtom.key));
  // If we haven't already read the thing, ask it from the selector
  if (!alreadyRead) {
    // First time through, add this to the list of stuff to sync to main
    try {
      // This side-effect should probably go in an effect
      // but I'm not concerned about letting the server-watching
      // hash table "bloat" right now...
      atomsToSync.set(theAtom.key, theAtom as RecoilState<unknown>);

      // Parse the data from the server (maybe this throws...)
      const value = (FTON.parse(selector) as unknown) as T;
      // set the backer atom to the value pulled from the server
      setAtomValue(value);
      // Flag as already-read, so we won't try to reset the value
      setAlreadyRead(true);
      return [value, setAtomValue];
    } catch (e) {
      log(`Error pulling value from server for ${theAtom.key}:`);
      log(e);
    }
  }
  return [atomValue, setAtomValue]; // [atomValue, setAtomValue];
}

/**
 * save any changed atoms that we've registers as "backed" to the server
 */
function saveToServer({ snapshot }: { snapshot: Snapshot }) {
  for (const modAtom of snapshot.getNodes_UNSTABLE({ isModified: true })) {
    if (atomsToSync.has(modAtom.key)) {
      const theAtom = snapshot.getLoadable<FTONData>(
        modAtom as RecoilValue<FTONData>,
      );
      if (theAtom.state === 'hasValue') {
        // TODO: Debounce this. It's way to chatty
        log(`Saving state to main process for key ${modAtom.key}`);
        SetGeneral(modAtom.key, FTON.stringify(theAtom.contents)).catch((e) => {
          log(`Error trying to save ${modAtom.key} value to server:`);
          log(e);
        });
      }
    }
  }
}

/**
 * The utility component to watch for persistence
 */
export function PersistenceObserver(): JSX.Element {
  useRecoilTransactionObserver_UNSTABLE(saveToServer);
  return <></>;
}
