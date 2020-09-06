import { atom, selectorFamily, useRecoilState } from 'recoil';
import { logger } from '@freik/simplelogger';
import { useRef, useEffect } from 'react';
import { FTON } from '@freik/core-utils';

import type { SongKey } from './MyStore';
import type { RecoilState } from 'recoil';
import type { MyWindow } from './AsyncDoodad';
import type { FTONData } from '@freik/core-utils';
// import RecentlyAdded from './Views/RecentlyAdded';

declare let window: MyWindow;

const log = logger.bind('Atoms');
// logger.enable('Atoms');

export type syncedAtom<T> = {
  atom: RecoilState<T>;
  AtomSyncer: () => JSX.Element | null;
};

export type MediaInfo = {
  general: Map<string, string>;
  audio: Map<string, string>;
};

// vvv That's a bug, pretty clearly :/
// eslint-disable-next-line no-shadow
export enum CurrentView {
  None = 0,
  Recent = 1,
  Album = 2,
  Artist = 3,
  Song = 4,
  Playlist = 5,
  Current = 6,
  Settings = 7,
}

export const CurViewAtom = atom<CurrentView>({
  key: 'CurrentView',
  default: CurrentView.Current,
});

// This should return a server-sync'ed atom
// { atom: theAtom, AtomSyncer: AtomSubscription };
export function makeBackedAtom<T>(key: string, def: T): syncedAtom<T> {
  // This is the atom that holds the sync'ed data
  const theAtom: RecoilState<T> = atom<T>({ key, default: def });
  // This is the React element that ensures's the synchronization takes place
  const AtomSyncer = (): JSX.Element | null => {
    // Getter/Setter
    const [atomValue, setAtomValue] = useRecoilState(theAtom);
    // Get a reference to the value
    const atomRef = useRef<T | null>(atomValue);

    // Register an effect to pull server side changes into the atom
    useEffect(() => {
      log(`key: ${key} effect triggered`);
      function handleChange(value: T) {
        if (
          atomRef &&
          FTON.stringify(atomRef.current as FTONData) !==
            FTON.stringify((value as unknown) as FTONData)
        ) {
          log(`key: ${key} updated to:`);
          log(value);
          atomRef.current = value;
          setAtomValue(value);
        }
      }
      // Register the listener
      const theID = window.ipc!.promiseSub(key, handleChange as any);
      return function cleanup() {
        window.ipc!.promiseUnsub(key, theID);
      };
    }, [atomRef, setAtomValue]);

    // This updates the server whenever the value or the ref changes
    useEffect(() => {
      log(`ref change triggered for ${key}`);
      if (
        FTON.stringify(atomValue as any) !==
        FTON.stringify(atomRef.current as any)
      ) {
        atomRef.current = atomValue;
        log(`Sending update for ${key}`);
        void window.ipcPromise!.send('promise-set', {
          key,
          value: atomValue,
        });
      }
      void window.ipcPromise!.send('promise-get', { key });
    }, [atomValue, atomRef]);
    return null;
  };
  return { atom: theAtom, AtomSyncer };
}

export const getMediaInfo = selectorFamily<any, SongKey>({
  key: 'mediaInfoSelector',
  // eslint-disable-next-line
  get: ((id: SongKey) => async (param: SongKey) => {
    const result = await window.ipcPromise!.send('promise-mediaInfo', id);
    return (result as any).data; // eslint-disable-line
  }) as any,
});

