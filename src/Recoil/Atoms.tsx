// eslint-disable-next-line @typescript-eslint/no-use-before-define
import { selector, selectorFamily, DefaultValue } from 'recoil';
import { Logger } from '@freik/core-utils';

import * as ipc from '../ipc';
import { makeAtom, syncAtom } from './helpers';

import type { SongKey } from '../DataSchema';

const log = Logger.bind('Atoms');
Logger.enable('Atoms');

export type MediaTime = {
  duration: number;
  position: number;
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

export const curViewAtom = makeAtom<CurrentView>(
  'CurrentView',
  CurrentView.settings,
);

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

export const mediaTimeAtom = makeAtom<MediaTime>('mediaTime', {
  duration: 0,
  position: 0,
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

export const shuffleAtom = syncAtom<boolean>('shuffle', false);
export const repeatAtom = syncAtom<boolean>('repeat', false);
export const playingAtom = makeAtom<boolean>('playing', false);
export const activePlaylistAtom = syncAtom<string>('active', '');
export const mutedAtom = syncAtom<boolean>('mute', false);
export const volumeAtom = syncAtom<number>('volume', 0.5);
