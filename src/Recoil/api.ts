import { atom } from 'recoil';

import type { SongKey, AlbumKey, ArtistKey } from '@freik/media-utils';
import ShuffleArray from '../ShuffleArray';

export function MaybePlayNextSong(
  curIndex: number,
  setCurIndex: (val: number) => void,
  repeat: boolean,
  shuffle: boolean,
  songList: SongKey[],
  setSongList: (val: SongKey[]) => void,
): boolean {
  if (curIndex + 1 < songList.length) {
    setCurIndex(curIndex + 1);
  } else if (repeat) {
    setCurIndex(0);
    if (shuffle) {
      songList = ShuffleArray(songList);
      setSongList(songList);
    }
  } else {
    return false;
  }
  return true;
}

export function MaybePlayPrevSong(
  curIndex: number,
  setCurIndex: (val: number) => void,
  repeat: boolean,
  songListLength: number,
): void {
  if (songListLength > 0) {
    if (curIndex > 0) {
      setCurIndex(curIndex - 1);
    } else if (repeat) {
      setCurIndex(songListLength - 1);
    }
  }
}

export const startSongPlayingAtom = atom<number>({
  key: 'StartSongPlaying',
  default: -1,
});

// This stops playback and clears the active playlist
export const stopAndClearAtom = atom<boolean>({
  key: 'StopAndClear',
  default: false,
});

export const deletePlaylistAtom = atom<string>({
  key: 'DeletePlaylist',
  default: '',
});

export const removeSongNumberAtom = atom<number>({
  key: 'RemoveSongNumber',
  default: -1,
});

export const addSongListAtom = atom<SongKey[]>({
  key: 'AddSongList',
  default: [],
});

export const addSongAtom = atom<SongKey>({
  key: 'AddSong',
  default: '',
});

export const addAlbumAtom = atom<AlbumKey>({
  key: 'AddAlbum',
  default: '',
});

export const addArtistAtom = atom<ArtistKey>({
  key: 'AddArtist',
  default: '',
});

export const startPlaylistAtom = atom<string>({
  key: 'StartPlaylist',
  default: '',
});

export const shuffleNowPlayingAtom = atom<boolean>({
  key: 'shuffleNowPlaying',
  default: false,
});
