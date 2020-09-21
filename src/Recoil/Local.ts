// eslint-disable-next-line @typescript-eslint/no-use-before-define
import { selector, selectorFamily, DefaultValue, atom } from 'recoil';
import { Playlist, SongKey } from '@freik/media-utils';

export type PlaylistName = string;

export type MediaTime = {
  duration: number;
  position: number;
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
export const activePlaylistAtom = atom<string>({ key: 'active', default: '' });
export const mutedAtom = atom<boolean>({ key: 'mute', default: false });
export const volumeAtom = atom<number>({ key: 'volume', default: 0.5 });
export const nowPlayingAtom = atom<string>({ key: 'nowPlaying', default: '' });

// This stuff is actually synchronized
export const playlistsAtom = atom<Map<PlaylistName, Playlist>>({
  key: 'Playlists',
  default: new Map<PlaylistName, SongKey[]>(),
});

export const playlistSel = selectorFamily<Playlist, PlaylistName>({
  key: 'playlist',
  get: (pl: PlaylistName) => ({ get }) => {
    const playlists = get(playlistsAtom);
    return playlists ? playlists.get(pl) ?? [] : [];
  },
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
    const songList = get(songListAtom);
    if (curIndex >= 0 && curIndex < songList.length) {
      return songList[curIndex];
    } else {
      return '';
    }
  },
});
