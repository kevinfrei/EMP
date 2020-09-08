import { atom, selectorFamily, useRecoilState } from 'recoil';
import { logger } from '@freik/simplelogger';
import { useRef, useEffect } from 'react';
import { FTON } from '@freik/core-utils';

import {
  PromiseSubscribe,
  PromiseUnsubscribe,
  PromiseSend,
  CallMain,
} from './MyWindow';

import type { SongKey } from './MyStore';
import type { RecoilState } from 'recoil';
import type { FTONData } from '@freik/core-utils';
// import RecentlyAdded from './Views/RecentlyAdded';

const log = logger.bind('Atoms');
logger.enable('Atoms');

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
      const theID = PromiseSubscribe(key, handleChange as any);
      return function cleanup() {
        PromiseUnsubscribe(key, theID);
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
        void PromiseSend('promise-set', {
          key,
          value: atomValue,
        });
      }
      void PromiseSend('promise-get', { key });
    }, [atomValue, atomRef]);
    return null;
  };
  return { atom: theAtom, AtomSyncer };
}

export const getMediaInfo = selectorFamily<MediaInfo, SongKey>({
  key: 'mediaInfoSelector',
  // eslint-disable-next-line
  get: (sk: SongKey) => async ({ get }): Promise<MediaInfo> => {
    const result = await CallMain<SongKey, MediaInfo>('get-media-info', sk);
    if (!result) throw new Error(sk);
    log(`Got media info for ${sk}:`);
    log(result);
    return result;
  },
});
