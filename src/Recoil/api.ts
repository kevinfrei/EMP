import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import {
  isAlbumKey,
  isArtistKey,
  isSongKey,
  MediaKey,
  PlaylistName,
  SongKey,
} from '@freik/media-core';
import { TransactionInterface_UNSTABLE } from 'recoil';
import { PostMain } from '../MyWindow';
import { isPlaylist, ShuffleArray } from '../Tools';
import {
  isSongHated,
  isSongLiked,
  neverPlayHatesState,
  onlyPlayLikesState,
} from './Likes';
import {
  activePlaylistState,
  currentIndexState,
  displayMessageState,
  nowPlayingSortState,
  recentlyQueuedState,
  songListState,
} from './Local';
import { mediaTimeState, playingState } from './MediaPlaying';
import { getPlaylistFamily, playlistNamesState } from './PlaylistsState';
import { getAlbumByKeyFamily, getArtistByKeyFamily } from './ReadOnly';
import { repeatState, shuffleState } from './ReadWrite';

const log = MakeLogger('api'); // eslint-disable-line
const err = MakeError('ReadWrite-err'); // eslint-disable-line

/**
 * Try to play the next song in the playlist
 * This function handles repeat & shuffle (thus they're required parameters...)
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns {Promise<boolean>} true if the next song started playing,
 *  false otherwise
 */
export function MaybePlayNext({
  get,
  set,
}: TransactionInterface_UNSTABLE): boolean {
  const curIndex = get(currentIndexState);
  const songList = get(songListState);
  if (curIndex + 1 < songList.length) {
    set(currentIndexState, curIndex + 1);
    return true;
  }
  const repeat = get(repeatState);
  if (!repeat) {
    return false;
  }
  const shuffle = get(shuffleState);
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
 * @returns Promise<void>
 */
export function MaybePlayPrev({
  get,
  set,
}: TransactionInterface_UNSTABLE): void {
  const songList = get(songListState);
  if (songList.length > 0) {
    const curIndex = get(currentIndexState);
    if (curIndex > 0) {
      set(currentIndexState, curIndex - 1);
    } else if (get(repeatState)) {
      set(currentIndexState, songList.length - 1);
    }
  }
}

/**
 * Filters down the list of songs to play according to filter preferences
 *
 * @param {Iterable<SongKey>} listToFilter - The list of songs to add
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns {SongKey[]} The filtered list of songs
 */
function GetFilteredSongs(
  xact: TransactionInterface_UNSTABLE,
  listToFilter: Iterable<SongKey>,
): SongKey[] {
  const onlyLikes = xact.get(onlyPlayLikesState);
  const neverHates = xact.get(neverPlayHatesState);
  const playList = [...listToFilter];
  const filtered = playList.filter((songKey: SongKey) => {
    if (onlyLikes) {
      return isSongLiked(xact, songKey);
    }
    if (neverHates) {
      return !isSongHated(xact, songKey);
    }
    return true;
  });
  return filtered.length === 0 ? playList : filtered;
}

/**
 * Adds a list of songs to the end of the current song list
 *
 * @param {Iterable<SongKey>} listToAdd - The list of songs to add
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export function AddSongs( // Deprecate this: It's only for tests now :/
  xact: TransactionInterface_UNSTABLE,
  listToAdd: Iterable<SongKey>,
): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { get, set } = xact;
  const shuffle = get(shuffleState);
  const playList = GetFilteredSongs(xact, listToAdd);
  if (!shuffle) {
    set(songListState, (songList: string[]) => [...songList, ...listToAdd]);
    set(currentIndexState, (curIndex) => (curIndex < 0 ? 0 : curIndex));
  } else {
    const shuffledList = ShuffleArray(playList);
    set(songListState, (songList: string[]) => [...songList, ...shuffledList]);
    set(currentIndexState, (curIndex) => (curIndex < 0 ? 0 : curIndex));
  }
  set(recentlyQueuedState, playList.length);
  set(displayMessageState, true);
}

/**
 * Adds a list of songs to the end of the current song list
 *
 * @param  {Iterable<SongKey>} listToPlay - The list of songs to start playing
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export function PlaySongs( // Deprecate this: It's only for tests now :/
  xact: TransactionInterface_UNSTABLE,
  listToPlay: Iterable<SongKey>,
  playlistName?: PlaylistName,
): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { get, set } = xact;
  let playList = GetFilteredSongs(xact, listToPlay);
  const shuffle = get(shuffleState);
  if (shuffle) {
    playList = ShuffleArray(playList);
  }
  if (isPlaylist(playlistName) && Type.isString(playlistName)) {
    set(activePlaylistState, playlistName);
  }
  set(songListState, playList);
  set(currentIndexState, playList.length >= 0 ? 0 : -1);
  set(recentlyQueuedState, playList.length);
  set(displayMessageState, true);
}

/**
 * Stop playback and clears the active playlist
 * It's pretty dumb in that it just calls a bunch of resetter's :/
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export function StopAndClear({ reset }: TransactionInterface_UNSTABLE): void {
  reset(songListState);
  reset(currentIndexState);
  reset(activePlaylistState);
  reset(mediaTimeState);
  reset(playingState);
}

/**
 * This shuffles now playing without changing what's currently playing
 * If something is playing, it's the first song in the shuffled playlist
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 */
export function ShufflePlaying({
  get,
  reset,
  set,
}: TransactionInterface_UNSTABLE): void {
  const curIndex = get(currentIndexState);
  reset(nowPlayingSortState);
  if (curIndex < 0) {
    set(songListState, (prevSongList: string[]) => ShuffleArray(prevSongList));
  } else {
    const curSongList = get(songListState);
    const curKey = curSongList[curIndex];
    let newSongs = [...curSongList];
    // Remove curKey from the array
    newSongs.splice(curIndex, 1);
    // Shuffle the array (without curKey)
    newSongs = ShuffleArray(newSongs);
    // Re-insert curKey back where it was
    newSongs.splice(curIndex, 0, curKey);
    reset(nowPlayingSortState);
    set(songListState, newSongs);
  }
}

/**
 * Rename a playlist (make sure you've got the name right)
 **/
export function RenamePlaylist(
  { set, get }: TransactionInterface_UNSTABLE,
  curName: PlaylistName,
  newName: PlaylistName,
): void {
  const curNames = get(playlistNamesState);
  const curSongs = get(getPlaylistFamily(curName));
  curNames.delete(curName);
  curNames.add(newName);
  set(getPlaylistFamily(newName), curSongs);
  set(playlistNamesState, new Set(curNames));
  void PostMain('rename-playlist', [curName, newName]);
}

/**
 * Delete a playlist (make sure you've got the name right)
 **/
export function DeletePlaylist(
  { set, get }: TransactionInterface_UNSTABLE,
  toDelete: PlaylistName,
): void {
  const curNames = get(playlistNamesState);
  const activePlaylist = get(activePlaylistState);
  curNames.delete(toDelete);
  set(playlistNamesState, new Set(curNames));
  if (activePlaylist === toDelete) {
    set(activePlaylistState, '');
  }
  void PostMain('delete-playlist', toDelete);
}

export function SongListFromKey(
  { get }: TransactionInterface_UNSTABLE,
  data: MediaKey,
): SongKey[] {
  if (data.length === 0) {
    return [];
  }
  if (isSongKey(data)) {
    return [data];
  }
  if (isAlbumKey(data)) {
    const alb = get(getAlbumByKeyFamily(data));
    return alb ? alb.songs : [];
  }
  if (isArtistKey(data)) {
    const art = get(getArtistByKeyFamily(data));
    return art ? art.songs : [];
  }
  return [];
}
