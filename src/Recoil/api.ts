import { FTON } from '@freik/core-utils';
import { PlaylistName, SongKey } from '@freik/media-utils';
import { CallbackInterface } from 'recoil';
import { InvokeMain } from '../MyWindow';
import { ShuffleArray } from '../Tools';
import {
  activePlaylistAtom,
  currentIndexAtom,
  currentSongKeySel,
  nowPlayingSortAtom,
  repeatAtom,
  shuffleAtom,
  songListAtom,
  stillPlayingAtom,
} from './Local';
import { playlistNamesSel, playlistSel } from './ReadWrite';

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
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export async function MaybePlayPrev({
  snapshot,
  set,
}: CallbackInterface): Promise<void> {
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
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export function AddSongs(
  listToAdd: Iterable<SongKey>,
  { set }: CallbackInterface,
): void {
  set(songListAtom, (songList) => [...songList, ...listToAdd]);
  set(currentIndexAtom, (curIndex) => (curIndex < 0 ? 0 : curIndex));
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
  if (playlistName) {
    set(activePlaylistAtom, playlistName);
  }
  set(songListAtom, [...listToPlay]);
  set(currentIndexAtom, index);
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
  const curSong = await snapshot.getPromise(currentSongKeySel);
  reset(songListAtom);
  reset(currentIndexAtom);
  reset(activePlaylistAtom);
  set(stillPlayingAtom, curSong);
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

/**
 * Rename a playlist (make sure you've got the name right)
 **/
export async function renamePlaylist(
  curName: PlaylistName,
  newName: PlaylistName,
  { reset, set, snapshot }: CallbackInterface,
): Promise<void> {
  const curNames = await snapshot.getPromise(playlistNamesSel);
  const curSongs = await snapshot.getPromise(playlistSel(curName));
  curNames.delete(curName);
  curNames.add(newName);
  await InvokeMain('rename-playlist', FTON.stringify({ curName, newName }));
  set(playlistNamesSel, new Set(curNames));
  reset(playlistSel(curName));
  set(playlistSel(newName), curSongs);
}

/**
 * Delete a playlist (make sure you've got the name right)
 **/
export async function deletePlaylist(
  toDelete: PlaylistName,
  { set, snapshot }: CallbackInterface,
): Promise<void> {
  const curNames = await snapshot.getPromise(playlistNamesSel);
  curNames.delete(toDelete);
  await InvokeMain('delete-playlist', toDelete);
  set(playlistNamesSel, new Set(curNames));
}

/**
 * Save a playlist (make sure you've got the name right)
 **/
export async function savePlaylist(
  name: PlaylistName,
  songs: SongKey[],
  { set, snapshot }: CallbackInterface,
): Promise<void> {
  const curNames = await snapshot.getPromise(playlistNamesSel);
  curNames.add(name);
  await InvokeMain('save-playlist', FTON.stringify({ name, songs }));
  set(playlistNamesSel, new Set<PlaylistName>(curNames));
  set(playlistSel(name), songs);
}
