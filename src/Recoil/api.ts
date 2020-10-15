import { SongKey } from '@freik/media-utils';
import { RecoilState, Snapshot } from 'recoil';
import { ShuffleArray } from '../Tools';
import { StatePair } from './helpers';
import {
  activePlaylistAtom,
  currentIndexAtom,
  nowPlayingAtom,
  nowPlayingSortAtom,
  repeatAtom,
  shuffleAtom,
  songListAtom,
} from './Local';

/**
 * Try to play the next song in the playlist
 * This function handles repeat & shuffle (thus they're required parameters...)
 *
 * @param  {number} curIndex
 * @param  {(val:number)=>void} setCurIndex
 * @param  {boolean} repeat
 * @param  {boolean} shuffle
 * @param  {SongKey[]} songList
 * @param  {(val:SongKey[])=>void} setSongList
 */
export function MaybePlayNextSong(
  [curIndex, setCurIndex]: StatePair<number>,
  repeat: boolean,
  shuffle: boolean,
  [songList, setSongList]: StatePair<SongKey[]>,
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

export async function MaybePlayNext(
  snapshot: Snapshot,
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void,
): Promise<boolean> {
  const curIndex = await snapshot.getPromise(currentIndexAtom);
  const songList = await snapshot.getPromise(songListAtom);
  if (curIndex + 1 < songList.length) {
    set(currentIndexAtom, curIndex + 1);
    return true;
  }
  const repeat = await snapshot.getPromise(repeatAtom);
  if (!repeat) {
    return false;
  }
  const shuffle = await snapshot.getPromise(shuffleAtom);
  if (shuffle) {
    set(songListAtom, ShuffleArray(songList));
  }
  set(currentIndexAtom, 0);
  return true;
}
/**
 * Try to play the 'previous' song, considering repeat possibilities
 *
 * @param  {number} curIndex
 * @param  {(val:number)=>void} setCurIndex
 * @param  {boolean} repeat
 * @param  {number} songListLength
 * @returns void
 */
export function MaybePlayPrevSong(
  [curIndex, setCurIndex]: StatePair<number>,
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

export async function MaybePlayPrev(
  snapshot: Snapshot,
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void,
): Promise<void> {
  const songList = await snapshot.getPromise(songListAtom);
  if (songList.length > 0) {
    const curIndex = await snapshot.getPromise(currentIndexAtom);
    if (curIndex > 0) {
      set(currentIndexAtom, curIndex - 1);
    } else if (await snapshot.getPromise(repeatAtom)) {
      set(currentIndexAtom, songList.length - 1);
    }
  }
}

/**
 * Adds a list of songs to the end of the current song list
 *
 * @param  {Iterable<SongKey>} listToAdd - The list of songs to add
 * @param  {number} curIndex
 * @param  {(val:number)=>void} setCurIndex
 * @param  {SongKey[]} songList
 * @param  {(val:SongKey[])=>void} setSongList
 * @returns void
 */
export function AddSongList(
  listToAdd: Iterable<SongKey>,
  [curIndex, setCurIndex]: StatePair<number>,
  [songList, setSongList]: StatePair<SongKey[]>,
): void {
  // TODO: Shuffle?
  setSongList([...songList, ...listToAdd]);
  if (curIndex < 0) {
    setCurIndex(0);
  }
}

export function AddSongs(
  listToAdd: Iterable<SongKey>,
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void,
): void {
  set(songListAtom, (songList) => [...songList, ...listToAdd]);
  set(currentIndexAtom, (curIndex) => (curIndex < 0 ? 0 : curIndex));
}

/**
 * Adds a list of songs to the end of the current song list
 *
 * @param  {Iterable<SongKey>} listToPlay - The list of songs to start playing
 * @param  {number} curIndex
 * @param  {(val:number)=>void} setCurIndex
 * @param  {SongKey[]} songList
 * @param  {(val:SongKey[])=>void} setSongList
 * @returns void
 */
export function PlaySongList(
  listToPlay: Iterable<SongKey>,
  [curIndex, setCurIndex]: StatePair<number>,
  [songList, setSongList]: StatePair<SongKey[]>,
): void {
  // TODO: Shuffle start
  setSongList([...listToPlay]);
  setCurIndex(0);
}

export function PlaySongs(
  listToPlay: Iterable<SongKey>,
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void,
): void {
  set(songListAtom, [...listToPlay]);
  set(currentIndexAtom, 0);
}

/**
 * Stop playback and clears the active playlist
 * It's pretty dumb in that it just calls a bunch of resetter's :/
 *
 * @param  {(recoilVal: RecoilState<any>) => void} reset the Recoil resetter
 *
 * @returns void
 */
export function StopAndClear(
  reset: (recoilVal: RecoilState<any>) => void,
): void {
  reset(songListAtom);
  reset(currentIndexAtom);
  reset(activePlaylistAtom);
  reset(nowPlayingAtom);
}

/**
 * This shuffles now playing without changing what's currently playing
 * If something is playing, it's the first song in the shuffled playlist
 *
 * @param  {number} currentIndex
 * @param  {(val:number)=>void} setCurrentIndex
 * @param  {SongKey[]} songList
 * @param  {(val:SongKey[])=>void} setSongList
 */
export function ShuffleNowPlaying(
  [currentIndex, setCurrentIndex]: StatePair<number>,
  [songList, setSongList]: StatePair<SongKey[]>,
  setNowPlayingSort: (srt: string) => void,
): void {
  let newSongs;
  setNowPlayingSort('');
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

export async function ShufflePlaying(
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void,
  snapshot: Snapshot,
): Promise<void> {
  const curIndex = await snapshot.getPromise(currentIndexAtom);
  set(nowPlayingSortAtom, '');
  if (curIndex < 0) {
    set(songListAtom, (prevSongList) => ShuffleArray(prevSongList));
  } else {
    const curSongList = await snapshot.getPromise(songListAtom);
    const curKey = curSongList[curIndex];
    let newSongs = [...curSongList];
    newSongs.splice(curIndex, 1);
    newSongs = [curKey, ...ShuffleArray(newSongs)];
    set(songListAtom, newSongs);
    set(currentIndexAtom, 0);
  }
}
