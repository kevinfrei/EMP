import { FTON, PlaylistName, SongKey, Type } from '@freik/core-utils';
import { CallbackInterface } from 'recoil';
import { InvokeMain } from '../MyWindow';
import { isPlaylist, ShuffleArray } from '../Tools';
import {
  activePlaylistState,
  currentIndexState,
  currentSongKeyState,
  nowPlayingSortState,
  repeatState,
  shuffleState,
  songListState,
  stillPlayingState,
} from './Local';
import { getPlaylistState, playlistNamesState } from './ReadWrite';

/**
 * Try to play the next song in the playlist
 * This function handles repeat & shuffle (thus they're required parameters...)
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns {Promise<boolean>} true if the next song started playing,
 *  false otherwise
 */
export async function MaybePlayNext({
  snapshot,
  set,
}: CallbackInterface): Promise<boolean> {
  const curIndex = await snapshot.getPromise(currentIndexState);
  const songList = await snapshot.getPromise(songListState);
  if (curIndex + 1 < songList.length) {
    set(currentIndexState, curIndex + 1);
    return true;
  }
  const repeat = await snapshot.getPromise(repeatState);
  if (!repeat) {
    return false;
  }
  const shuffle = await snapshot.getPromise(shuffleState);
  if (shuffle) {
    set(songListState, ShuffleArray(songList));
  }
  set(currentIndexState, 0);
  return true;
}

/**
 * Try to play the 'previous' song, considering repeat possibilities
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export async function MaybePlayPrev({
  snapshot,
  set,
}: CallbackInterface): Promise<void> {
  const songList = await snapshot.getPromise(songListState);
  if (songList.length > 0) {
    const curIndex = await snapshot.getPromise(currentIndexState);
    if (curIndex > 0) {
      set(currentIndexState, curIndex - 1);
    } else if (await snapshot.getPromise(repeatState)) {
      set(currentIndexState, songList.length - 1);
    }
  }
}

/**
 * Adds a list of songs to the end of the current song list
 *
 * @param {Iterable<SongKey>} listToAdd - The list of songs to add
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export function AddSongs(
  listToAdd: Iterable<SongKey>,
  { set }: CallbackInterface,
): void {
  set(songListState, (songList) => [...songList, ...listToAdd]);
  set(currentIndexState, (curIndex) => (curIndex < 0 ? 0 : curIndex));
}

/**
 * Adds a list of songs to the end of the current song list
 *
 * @param  {Iterable<SongKey>} listToPlay - The list of songs to start playing
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export function PlaySongs(
  { set }: CallbackInterface,
  listToPlay: Iterable<SongKey>,
  playlistName?: PlaylistName,
): void {
  let index = -1;
  for (const sk of listToPlay) {
    if (sk.length) {
      index = 0;
      break;
    }
  }
  if (isPlaylist(playlistName) && Type.isString(playlistName)) {
    set(activePlaylistState, playlistName);
  }
  set(songListState, [...listToPlay]);
  set(currentIndexState, index);
}

/**
 * Stop playback and clears the active playlist
 * It's pretty dumb in that it just calls a bunch of resetter's :/
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export async function StopAndClear({
  set,
  reset,
  snapshot,
}: CallbackInterface): Promise<void> {
  const curSong = await snapshot.getPromise(currentSongKeyState);
  set(stillPlayingState, curSong);
  reset(songListState);
  reset(currentIndexState);
  reset(activePlaylistState);
  // TODO: Go stop the audio element while we're at it?
}

/**
 * This shuffles now playing without changing what's currently playing
 * If something is playing, it's the first song in the shuffled playlist
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 */
export async function ShufflePlaying({
  snapshot,
  set,
}: CallbackInterface): Promise<void> {
  const curIndex = await snapshot.getPromise(currentIndexState);
  set(nowPlayingSortState, '');
  if (curIndex < 0) {
    set(songListState, (prevSongList) => ShuffleArray(prevSongList));
  } else {
    const curSongList = await snapshot.getPromise(songListState);
    const curKey = curSongList[curIndex];
    let newSongs = [...curSongList];
    newSongs.splice(curIndex, 1);
    newSongs = [curKey, ...ShuffleArray(newSongs)];
    set(songListState, newSongs);
    set(currentIndexState, 0);
  }
}

/**
 * Rename a playlist (make sure you've got the name right)
 **/
export async function renamePlaylist(
  { reset, set, snapshot }: CallbackInterface,
  curName: PlaylistName,
  newName: PlaylistName,
): Promise<void> {
  const curNames = await snapshot.getPromise(playlistNamesState);
  const curSongs = await snapshot.getPromise(getPlaylistState(curName));
  curNames.delete(curName);
  curNames.add(newName);
  await InvokeMain('rename-playlist', FTON.stringify({ curName, newName }));
  set(getPlaylistState(newName), curSongs);
  set(playlistNamesState, new Set(curNames));
}

/**
 * Delete a playlist (make sure you've got the name right)
 **/
export async function deletePlaylist(
  toDelete: PlaylistName,
  { set, snapshot }: CallbackInterface,
): Promise<void> {
  const curNames = await snapshot.getPromise(playlistNamesState);
  const activePlaylist = await snapshot.getPromise(activePlaylistState);
  curNames.delete(toDelete);
  await InvokeMain('delete-playlist', toDelete);
  set(playlistNamesState, new Set(curNames));
  if (activePlaylist === toDelete) {
    set(activePlaylistState, '');
  }
}
