// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useRef, useEffect } from 'react';
import {
  atom,
  selector,
  selectorFamily,
  useRecoilState,
  DefaultValue,
} from 'recoil';
import { Logger, FTON } from '@freik/core-utils';

import * as ipc from '../ipc';

import type { SongKey } from '../DataSchema';
import type { RecoilState } from 'recoil';
import type { FTONData } from '@freik/core-utils';

const log = Logger.bind('Atoms');
Logger.enable('Atoms');

export type MediaTime = {
  duration: number;
  position: number;
};

export type SyncedAtom<T> = {
  atom: RecoilState<T>;
  atomSyncer: () => JSX.Element;
};

export type MediaInfo = {
  general: Map<string, string>;
  audio: Map<string, string>;
};

// vvv That's a bug, pretty clearly :/
// eslint-disable-next-line no-shadow
export enum CurrentView {
  none = 0,
  recent = 1,
  album = 2,
  artist = 3,
  song = 4,
  playlist = 5,
  current = 6,
  settings = 7,
}

export const curViewAtom = atom<CurrentView>({
  key: 'CurrentView',
  default: CurrentView.settings,
});

// This should return a server-sync'ed atom
// { atom: theAtom, AtomSyncer: AtomSubscription };
export function makeBackedAtom<T>(key: string, def: T): SyncedAtom<T> {
  // This is the atom that holds the sync'ed data
  const theAtom: RecoilState<T> = atom<T>({ key, default: def });
  // This is the React element that ensures's the synchronization takes place
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const AtomSyncer = (): JSX.Element => {
    // Getter/Setter
    const [atomValue, setAtomValue] = useRecoilState(theAtom);
    // Get a reference to the value
    const atomRef = useRef<T | null>(atomValue);

    // Register an effect to pull server side changes into the atom
    useEffect(() => {
      log(`key: ${key} effect triggered`);
      ipc
        .GetGeneral(key)
        .then((value: string | void) => {
          log(`GetGeneral(${key}) promise completed`);
          log(value);
          if (
            value &&
            atomRef &&
            FTON.stringify((atomRef.current as unknown) as FTONData) !== value
          ) {
            log(`key: ${key} updated to:`);
            log(value);
            const newVal: T = (FTON.parse(value) as unknown) as T;
            atomRef.current = newVal;
            setAtomValue(newVal);
          }
        })
        .catch((reason) => {
          log('GetGeneral failed!');
          log(reason);
        });
    }, [atomRef, setAtomValue]);

    // This updates the server whenever the value or the ref changes
    useEffect(() => {
      log(`ref change triggered for ${key}`);
      if (
        atomRef &&
        atomRef.current &&
        FTON.stringify(atomValue as any) !==
          FTON.stringify(atomRef.current as any)
      ) {
        atomRef.current = atomValue;
        log(`Sending update for ${key}`);
        ipc
          .SetGeneral(key, FTON.stringify(atomValue as any))
          .catch((reason) => {
            log('SetGeneral failed!');
            log(reason);
          });
      }
    }, [atomValue, atomRef]);
    return <></>;
  };
  return { atom: theAtom, atomSyncer: AtomSyncer };
}

export const getMediaInfo = selectorFamily<MediaInfo, SongKey>({
  key: 'mediaInfoSelector',
  // eslint-disable-next-line
  get: (sk: SongKey) => async ({ get }): Promise<MediaInfo> => {
    if (!sk)
      return {
        general: new Map<string, string>(),
        audio: new Map<string, string>(),
      };
    const result = await ipc.GetMediaInfo(sk);
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
export const mutedAtom = atom<boolean>({ key: 'mute', default: false });
export const volumeAtom = atom<number>({ key: 'volume', default: 0.5 });
