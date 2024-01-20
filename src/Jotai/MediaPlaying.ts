import { atom } from 'jotai';
import { RESET, atomWithReset } from 'jotai/utils';
import { secondsToTime } from '../Tools';

export type MediaTime = {
  duration: number;
  position: number;
};

function MakeMediaTime(duration: number, position: number): MediaTime {
  return { duration, position };
}

// This reflects the current state of audio playback
// True: It's playing; False: It's paused/stopped
export const playingAtom = atomWithReset(false);

// The duration & current position of the currently playing song
export const mediaTimeAtom = atomWithReset(MakeMediaTime(0, 0));

// Current position, in a 'time' string format
export const mediaTimePositionAtom = atom((get) => {
  const { position } = get(mediaTimeAtom);
  return position > 0 ? secondsToTime(position) : '';
});

// Current time remaining in a 'time' string format
export const mediaTimeRemainingAtom = atom((get): string => {
  const { position, duration } = get(mediaTimeAtom);
  return duration > 0 ? '-' + secondsToTime(duration - position) : '';
});

// Percent interpolation of current position
export const mediaTimePercentAtom = atom(
  (get): number => {
    const { position, duration } = get(mediaTimeAtom);
    return duration > 0 ? position / duration : 0;
  },
  (get, set, newValue: number | typeof RESET) => {
    const { duration } = get(mediaTimeAtom);
    const newVal = Math.min(
      1.0,
      Math.max(0, (typeof newValue === typeof RESET ? 0 : newValue) as number),
    );
    set(mediaTimeAtom, MakeMediaTime(duration, duration * newVal));
  },
);
