import { SongKey } from '@freik/media-utils';
import { RecoilState, Snapshot } from 'recoil';
import { ShuffleArray } from '../Tools';
import {
  activePlaylistAtom,
  currentIndexAtom,
  currentSongKeySel,
  nowPlayingAtom,
  nowPlayingSortAtom,
  repeatAtom,
  shuffleAtom,
  songListAtom,
  stillPlayingAtom,
} from './Local';

/**
 * Try to play the next song in the playlist
 * This function handles repeat & shuffle (thus they're required parameters...)
 *
 * @param {Snapshot} snapshot - a Recoil snapshot
 * @param set - The Recoil setter function
 *
 * @returns {Promise<boolean>} true if the next song started playing,
 *  false otherwise
 */
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
 * @param {Snapshot} snapshot - a Recoil snapshot
 * @param set - The Recoil setter function
 *
 * @returns void
 */
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
 * @param {Iterable<SongKey>} listToAdd - The list of songs to add
 * @param set - The Recoil setter function
 *
 * @returns void
 */
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
 * @param set - The Recoil setter function
 *
 * @returns void
 */
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
export async function StopAndClear({
  set,
  reset,
  snapshot,
}: {
  snapshot: Snapshot;
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void;
  reset: (recoilVal: RecoilState<any>) => void;
}): Promise<void> {
  const curSong = await snapshot.getPromise(currentSongKeySel);
  reset(songListAtom);
  reset(currentIndexAtom);
  reset(activePlaylistAtom);
  reset(nowPlayingAtom);
  set(stillPlayingAtom, curSong);
  // TODO: Go stop the audio element while we're at it?
}

/**
 * This shuffles now playing without changing what's currently playing
 * If something is playing, it's the first song in the shuffled playlist
 *
 * @param {Snapshot} snapshot - a Recoil snapshot
 * @param set - The Recoil setter function
 */
export async function ShufflePlaying(
  snapshot: Snapshot,
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void,
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
