import { Song, SongKey } from '@freik/media-utils';
import { atom, DefaultValue, selector } from 'recoil';
import { secondsToTime } from '../Tools';

export type PlaylistName = string;

export type MediaTime = {
  duration: number;
  position: number;
};

export const mediaTimeAtom = atom<MediaTime>({
  key: 'mediaTime',
  default: {
    duration: 0,
    position: 0,
  },
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
export const activePlaylistAtom = atom<string>({
  key: 'nowPlaying',
  default: '',
});
export const stillPlayingAtom = atom<SongKey>({
  key: 'StillPlaying',
  default: '',
});

export const songListAtom = atom<SongKey[]>({
  key: 'currentSongList',
  default: [],
});

export const currentIndexAtom = atom<number>({
  key: 'currentIndex',
  default: -1,
});

export const currentSongKeySel = selector<SongKey>({
  key: 'currentSongKey',
  get: ({ get }) => {
    const curIndex = get(currentIndexAtom);
    if (curIndex >= 0) {
      const songList = get(songListAtom);
      if (curIndex >= 0 && curIndex < songList.length) {
        return songList[curIndex];
      } else {
        return '';
      }
    } else {
      return get(stillPlayingAtom);
    }
  },
});

// Is there a 'next song' to play?
export const hasNextSongSel = selector<boolean>({
  key: 'hasNextSong',
  get: ({ get }) => {
    const songList = get(songListAtom);
    if (songList.length === 0) {
      return false;
    }
    const curIndex = get(currentIndexAtom);
    if (curIndex >= 0 && curIndex < songList.length - 1) {
      return true;
    }
    return get(repeatAtom);
  },
});

// Is there a 'previous song' to play?
export const hasPrevSongSel = selector<boolean>({
  key: 'hasPrevSong',
  get: ({ get }) => {
    const songList = get(songListAtom);
    if (songList.length === 0) {
      return false;
    }
    const curIndex = get(currentIndexAtom);
    return curIndex > 0 || get(repeatAtom);
  },
});

// Do we have any songs at all?
export const hasAnySongsSel = selector<boolean>({
  key: 'hasAnySongs',
  get: ({ get }) => get(songListAtom).length > 0,
});

// This is the sort for the current playlist
export const nowPlayingSortAtom = atom<string>({
  key: 'nowPlayingSort',
  default: '',
});

export const songDetailAtom = atom<Song | null>({
  key: 'songDetail',
  default: null,
});
