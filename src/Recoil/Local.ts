import { Song, SongKey } from '@freik/core-utils';
import { atom, DefaultValue, selector } from 'recoil';
import { secondsToTime } from '../Tools';

export type PlaylistName = string;

export type MediaTime = {
  duration: number;
  position: number;
};

export const mediaTimeState = atom<MediaTime>({
  key: 'mediaTime',
  default: {
    duration: 0,
    position: 0,
  },
});

export const mediaTimePositionState = selector<string>({
  key: 'mediaTimePosition',
  get: ({ get }): string => {
    const { position } = get(mediaTimeState);
    return position > 0 ? secondsToTime(position) : '';
  },
});

export const mediaTimeRemainingState = selector<string>({
  key: 'mediaTimeRemaining',
  get: ({ get }): string => {
    const { position, duration } = get(mediaTimeState);
    return duration > 0 ? '-' + secondsToTime(duration - position) : '';
  },
});

export const mediaTimePercentState = selector<number>({
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

export const shuffleState = atom<boolean>({ key: 'shuffle', default: false });
export const repeatState = atom<boolean>({ key: 'repeat', default: false });
export const playingState = atom<boolean>({ key: 'playing', default: false });
export const activePlaylistState = atom<string>({
  key: 'nowPlaying',
  default: '',
});
export const stillPlayingState = atom<SongKey>({
  key: 'StillPlaying',
  default: '',
});

export const songListState = atom<SongKey[]>({
  key: 'currentSongList',
  default: [],
});

export const currentIndexState = atom<number>({
  key: 'currentIndex',
  default: -1,
});

export const currentSongKeyState = selector<SongKey>({
  key: 'currentSongKey',
  get: ({ get }) => {
    const curIndex = get(currentIndexState);
    if (curIndex >= 0) {
      const songList = get(songListState);
      if (curIndex >= 0 && curIndex < songList.length) {
        return songList[curIndex];
      } else {
        return '';
      }
    } else {
      return get(stillPlayingState);
    }
  },
});

// Is there a 'next song' to play?
export const hasNextSongState = selector<boolean>({
  key: 'hasNextSong',
  get: ({ get }) => {
    const songList = get(songListState);
    if (songList.length === 0) {
      return false;
    }
    const curIndex = get(currentIndexState);
    if (curIndex >= 0 && curIndex < songList.length - 1) {
      return true;
    }
    return get(repeatState);
  },
});

// Is there a 'previous song' to play?
export const hasPrevSongState = selector<boolean>({
  key: 'hasPrevSong',
  get: ({ get }) => {
    const songList = get(songListState);
    if (songList.length === 0) {
      return false;
    }
    const curIndex = get(currentIndexState);
    return curIndex > 0 || get(repeatState);
  },
});

// Do we have any songs at all?
export const hasAnySongsState = selector<boolean>({
  key: 'hasAnySongs',
  get: ({ get }) => get(songListState).length > 0,
});

// This is the sort for the current playlist
export const nowPlayingSortState = atom<string>({
  key: 'nowPlayingSort',
  default: '',
});

export const songDetailState = atom<Song | null>({
  key: 'songDetail',
  default: null,
});

export const keyFilterState = atom<string>({ key: 'keyFilter', default: '' });
