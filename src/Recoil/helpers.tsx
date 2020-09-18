// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState } from 'react';
import { FTON, FTONData } from '@freik/core-utils';
import {
  RecoilState,
  atom,
  selectorFamily,
  useRecoilState,
  DefaultValue,
  useRecoilValue,
  useRecoilTransactionObserver_UNSTABLE,
  Snapshot,
  RecoilValue,
} from 'recoil';
import { GetGeneral, SetGeneral } from '../ipc';

const backerSelFamily = selectorFamily({
  key: 'sync',
  get: (param: string) => async ({ get }): Promise<string> => {
    const serverVal = await GetGeneral(param);
    return serverVal || '';
  },
  set: (param: string) => (
    { get, set, reset },
    newVal: string | DefaultValue,
  ): void => {
  	' ';
  },
});

// This will trigger a server side pull of the initial value, then use local
// state for all subsequent sets. This must be used in tandem with the
// PersistenceObserver transaction watcher and the syncAtom maker
export function useBackedState<T>(theAtom: RecoilState<T>): [T, (val: T) => void] {
  const [alreadyRead, setAlreadyRead] = useState(false);
  const [atomValue, setAtomValue] = useRecoilState<T>(theAtom);
  const selector = useRecoilValue<string>(backerSelFamily(theAtom.key));
  // If we haven't already read the thing, ask it from the selector
  let value: T;
  if (!alreadyRead) {
    value = (FTON.parse(selector) as unknown) as T;
    setAtomValue(value);
    setAlreadyRead(true);
  } else {
    value = atomValue;
  }
  const setter = (val: T) => {
    setAtomValue(val);
  };
  return [value, setter];
}

const atoms = new Map<string, RecoilState<unknown>>();
const sync = new Map<string, RecoilState<unknown>>();

export function makeAtom<T>(key: string, defaultValue: T): RecoilState<T> {
  const theAtom = atom<T>({ key: 'local_' + key, default: defaultValue });
  atoms.set(key, theAtom as RecoilState<unknown>);
  return theAtom;
}

// For a synchronized state, I need the 'backed' atom to register with the
// persistence observer, and the "public" selector to query from the server
export function syncAtom<T>(key: string, defaultValue: T): RecoilState<T> {
  const theAtom = atom<T>({ key: 'sync_' + key, default: defaultValue });
  sync.set(key, theAtom as RecoilState<unknown>);
  return theAtom;
}

export function syncedAtoms(): Iterable<RecoilState<unknown>> {
  return sync.values();
}

export function PersistenceObserver(): JSX.Element {
  useRecoilTransactionObserver_UNSTABLE(
    ({ snapshot }: { snapshot: Snapshot }) => {
      for (const modifiedAtom of snapshot.getNodes_UNSTABLE({
        isModified: true,
      })) {
        if (sync.has(modifiedAtom.key)) {
          const atomLoadable = snapshot.getLoadable<FTONData>(
            modifiedAtom as RecoilValue<FTONData>,
          );
          if (atomLoadable.state === 'hasValue') {
            SetGeneral(
              modifiedAtom.key,
              FTON.stringify(atomLoadable.contents),
            ).catch((e) => {
              // check it
            });
          }
        }
      }
    },
  );
  return <></>;
}
