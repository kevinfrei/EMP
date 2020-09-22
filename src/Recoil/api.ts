import { atom } from 'recoil';

import type { SongKey } from '@freik/media-utils';
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

export const deletePlaylistAtom = atom<string>({
  key: 'DeletePlaylist',
  default: '',
});

export const startPlaylistAtom = atom<string>({
  key: 'StartPlaylist',
  default: '',
});

// Adds a list of songs to the end of the current song list
export function AddSongList(
  listToAdd: SongKey[],
  curIndex: number,
  setCurIndex: (val: number) => void,
  songList: SongKey[],
  setSongList: (val: SongKey[]) => void,
): void {
  if (listToAdd.length > 0) {
    setSongList([...songList, ...listToAdd]);
    if (curIndex < 0) {
      setCurIndex(0);
    }
  }
}

// This stops playback and clears the active playlist
export function StopAndClear(
  resetSongList: () => void,
  resetCurrentIndex: () => void,
  resetActivePlaylist: () => void,
  resetNowPlaying: () => void,
): void {
  resetSongList();
  resetCurrentIndex();
  resetActivePlaylist();
  resetNowPlaying();
}

/**
 * This shuffles now playing without changing what's currently playing
 * If something is playing, it's the first song in the shuffled playlist
 * @function
 * @param  {number} currentIndex - current index value
 * @param  {(val:number)=>void} setCurrentIndex - func to set new index value
 * @param  {SongKey[]} songList - current song list
 * @param  {(val:SongKey[])=>void} setSongList - func to set the new song list
 */
export function ShuffleNowPlaying(
  currentIndex: number,
  setCurrentIndex: (val: number) => void,
  songList: SongKey[],
  setSongList: (val: SongKey[]) => void,
): void {
  let newSongs;
  if (currentIndex < 0) {
    newSongs = ShuffleArray(songList);
  } else {
    // if we're currently playing something, remove it from the array
    const curKey = songList[currentIndex];
    newSongs = [...songList];
    newSongs.splice(currentIndex, 1);
    // Now put it at the top of the list
    newSongs = [curKey, ...ShuffleArray(newSongs)];
    setCurrentIndex(0);
  }
  setSongList(newSongs);
}
