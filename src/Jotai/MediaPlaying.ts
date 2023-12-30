import { atom } from 'jotai';
import { RESET, atomWithReset } from 'jotai/utils';
import { secondsToTime } from '../Tools';

export type MediaTime = {
  duration: number;
  position: number;
};

// This reflects the current state of audio playback
// True: It's playing; False: It's paused/stopped
export const playingState = atomWithReset(false);

// The duration & current position of the currently playing song
export const mediaTimeState = atomWithReset<MediaTime>({
  duration: 0,
  position: 0,
});

// Current position, in a 'time' string format
export const mediaTimePositionFunc = atom<string>((get): string => {
  const { position } = get(mediaTimeState);
  return position > 0 ? secondsToTime(position) : '';
});

// Current time remaining in a 'time' string format
export const mediaTimeRemainingFunc = atom<string>((get): string => {
  const { position, duration } = get(mediaTimeState);
  return duration > 0 ? '-' + secondsToTime(duration - position) : '';
});

// Percent interpolation of current position
export const mediaTimePercentFunc = atom(
  (get): number => {
    const { position, duration } = get(mediaTimeState);
    return duration > 0 ? position / duration : 0;
  },
  (get, set, newValue: number | typeof RESET) => {
    const { duration } = get(mediaTimeState);
    const newVal = Math.min(
      1.0,
      Math.max(0, (typeof newValue === typeof RESET ? 0 : newValue) as number),
    );
    set(mediaTimeState, { position: duration * newVal, duration });
  },
);
