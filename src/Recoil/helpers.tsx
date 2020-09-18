// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState } from 'react';
import { Logger, FTON, FTONData } from '@freik/core-utils';
import {
  RecoilState,
  selectorFamily,
  useRecoilState,
  useRecoilValue,
  useRecoilTransactionObserver_UNSTABLE,
  Snapshot,
  RecoilValue,
} from 'recoil';
import { GetGeneral, SetGeneral } from '../ipc';

const log = Logger.bind('helpers');
Logger.enable('helpers');

const atomsToSync = new Map<string, RecoilState<unknown>>();

const backerSelFamily = selectorFamily({
  key: 'sync',
  get: (param: string) => async (): Promise<string> => {
    const serverVal = await GetGeneral(param);
    return serverVal || '';
  },
});

// This will trigger a server side pull of the initial value, then use local
// state for all subsequent sets. This must be used in tandem with the
// PersistenceObserver transaction watcher and the syncAtom maker
export function useBackedState<T>(
  theAtom: RecoilState<T>,
): [T, (val: T) => void] {
  const [alreadyRead, setAlreadyRead] = useState(false);
  const [atomValue, setAtomValue] = useRecoilState<T>(theAtom);
  const selector = useRecoilValue<string>(backerSelFamily(theAtom.key));
  // If we haven't already read the thing, ask it from the selector
  let value: T;
  if (!alreadyRead) {
    // First time through, add this to the list of stuff to sync to main
    try {
      atomsToSync.set(theAtom.key, theAtom as RecoilState<unknown>);
      value = (FTON.parse(selector) as unknown) as T;
      setAtomValue(value);
      setAlreadyRead(true);
    } catch (e) {
      value = atomValue;
    }
  } else {
    value = atomValue;
  }
  return [value, setAtomValue]; // [atomValue, setAtomValue];
}

export function syncedAtoms(): Iterable<RecoilState<unknown>> {
  return atomsToSync.values();
}

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

export function PersistenceObserver(): JSX.Element {
  useRecoilTransactionObserver_UNSTABLE(saveToServer);
  return <></>;
}
