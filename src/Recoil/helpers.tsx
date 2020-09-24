import { FTON, FTONData, Logger } from '@freik/core-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import {
  RecoilState,
  RecoilValue,
  selectorFamily,
  Snapshot,
  useRecoilState,
  useRecoilTransactionObserver_UNSTABLE,
  useRecoilValue,
} from 'recoil';
import { GetGeneral, SetGeneral } from '../ipc';

// [state, show (set true), hide (set false)]
export type BoolState = [boolean, () => void, () => void];

const log = Logger.bind('helpers');
// Logger.enable('helpers');

/**
 * A short cut for on/off states to make some things (like dialogs) cleaner
 *
 * @returns {BoolState} [state, trueSetter(), falseSetter()]
 */
export function useBoolState(initial: boolean): BoolState {
  const [dialogState, setDialogState] = useState(initial);
  return [dialogState, () => setDialogState(false), () => setDialogState(true)];
}

// This is the list of atoms that we're sync'ing back to the main process
const atomsToSync = new Map<string, RecoilState<unknown>>();

/**
 * This is a selector to acquire a particular value from the server.
 * Any values wind up being "read once" and the actual atom winds up containing
 * the current server value. This *does not work* for server-originating
 * changes!!!
 */
export const backerSelFamily = selectorFamily({
  key: 'sync',
  get: (param: string) => async (): Promise<string> => {
    const serverVal = await GetGeneral(param);
    return serverVal || '';
  },
});

/**
 * This will trigger a server side pull of the initial value, then use local
 * state for all subsequent sets. This must be used in tandem with the
 * PersistenceObserver transaction watcher and the syncAtom maker
 */
export function useBackedState<T>(
  theAtom: RecoilState<T>,
): [T, (val: T) => void] {
  // A little 'local' state
  const [alreadyRead, setAlreadyRead] = useState(false);
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
