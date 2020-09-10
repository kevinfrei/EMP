import {
  atom,
  selector,
  selectorFamily,
  useRecoilState,
  DefaultValue,
} from 'recoil';
import { useRef, useEffect } from 'react';
import { Logger, FTON } from '@freik/core-utils';

import {
  PromiseSubscribe,
  PromiseUnsubscribe,
  PromiseSend,
  CallMain,
} from '../MyWindow';

import type { SongKey } from '../MyStore';
import type { RecoilState } from 'recoil';
import type { FTONData } from '@freik/core-utils';
// import RecentlyAdded from './Views/RecentlyAdded';

const log = Logger.bind('Atoms');
Logger.enable('Atoms');

export type MediaTime = {
  duration: number;
  position: number;
};

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

const secondsToTime = (val: number): string => {
  const expr = new Date(val * 1000).toISOString();
  if (val < 600) {
    return expr.substr(15, 4);
  } else if (val < 3600) {
    return expr.substr(14, 5);
  } else if (val < 36000) {
    return expr.substr(12, 7);
  } else {
    return expr.substr(11, 8);
  }
};

export const mediaTimeAtom = atom<MediaTime>({
  key: 'mediaTime',
  default: { duration: 0, position: 0 },
});

export const mediaTimePositionSel = selector<string>({
  key: 'mediaTimePosition',
  get: ({ get }): string => {
    const { position } = get(mediaTimeAtom);
    return position > 0 ? secondsToTime(position) : '';
  },
});

export const mediaTimeRemainingSel = selector<string>({
  key: 'mediaTimeRemaining',
  get: ({ get }): string => {
    const { position, duration } = get(mediaTimeAtom);
    return duration > 0 ? '-' + secondsToTime(duration - position) : '';
  },
});

export const mediaTimePercentRWSel = selector<number>({
  key: 'mediaTimePercent',
  get: ({ get }): number => {
    const { position, duration } = get(mediaTimeAtom);
    return duration > 0 ? position / duration : 0;
  },
  set: ({ get, set }, newValue) => {
    const { duration } = get(mediaTimeAtom);
    const newVal: number = newValue instanceof DefaultValue ? 0 : newValue;
    if (duration > 0) {
      set(mediaTimeAtom, { position: duration * newVal, duration });
    }
  },
});

export const shuffleAtom = atom<boolean>({ key: 'shuffle', default: false });
export const repeatAtom = atom<boolean>({ key: 'repeat', default: false });
export const playingAtom = atom<boolean>({ key: 'playing', default: false });
export const activePlaylistAtom = atom<string>({ key: 'active', default: '' });
