import React from 'react';
import {
  RecoilValue,
  Snapshot,
  useRecoilTransactionObserver_UNSTABLE,
} from 'recoil';
import { FTON, FTONData } from '@freik/core-utils';

import { SetGeneral } from '../ipc';
export function PersistenceObserver(): JSX.Element {
  useRecoilTransactionObserver_UNSTABLE(
    ({ snapshot }: { snapshot: Snapshot }) => {
      for (const modifiedAtom of snapshot.getNodes_UNSTABLE({
        isModified: true,
      })) {
        if (modifiedAtom.key.startsWith('sync_')) {
          const atomLoadable = snapshot.getLoadable<FTONData>(
            modifiedAtom as RecoilValue<FTONData>,
          );
          if (atomLoadable.state === 'hasValue') {
            SetGeneral(
              modifiedAtom.key,
              FTON.stringify({ value: atomLoadable.contents }),
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
