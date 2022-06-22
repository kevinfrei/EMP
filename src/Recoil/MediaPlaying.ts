import { atom, DefaultValue, selector } from 'recoil';
import { secondsToTime } from '../Tools';

export type MediaTime = {
  duration: number;
  position: number;
};

// This reflects the current state of audio playback
// True: It's playing; False: It's paused/stopped
export const playingState = atom<boolean>({
  key: 'playing',
  default: false,
});

// The duration & current position of the currently playing song
export const mediaTimeState = atom<MediaTime>({
  key: 'mediaTime',
  default: {
    duration: 0,
    position: 0,
  },
});

// Current position, in a 'time' string format
export const mediaTimePositionFunc = selector<string>({
  key: 'mediaTimePosition',
  get: ({ get }): string => {
    const { position } = get(mediaTimeState);
    return position > 0 ? secondsToTime(position) : '';
  },
});

// Current time remaining in a 'time' string format
export const mediaTimeRemainingFunc = selector<string>({
  key: 'mediaTimeRemaining',
  get: ({ get }): string => {
    const { position, duration } = get(mediaTimeState);
    return duration > 0 ? '-' + secondsToTime(duration - position) : '';
  },
});

// Percent interpolation of current position
export const mediaTimePercentFunc = selector<number>({
  key: 'mediaTimePercent',
  get: ({ get }): number => {
    const { position, duration } = get(mediaTimeState);
    return duration > 0 ? position / duration : 0;
  },
  set: ({ get, set }, newValue) => {
    const { duration } = get(mediaTimeState);
    const newVal: number = newValue instanceof DefaultValue ? 0 : newValue;
    if (duration > 0) {
      set(mediaTimeState, { position: duration * newVal, duration });
    }
  },
});
