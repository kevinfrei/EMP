import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import {
  isAlbumKey,
  isArtistKey,
  isSongKey,
  MediaKey,
  PlaylistName,
  SongKey,
} from '@freik/media-core';
import { RecoilState, RecoilValueReadOnly, useRecoilCallback } from 'recoil';
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
  songPlaybackOrderState,
} from './Local';
import { mediaTimeState, playingState } from './MediaPlaying';
import { playlistFuncFam, playlistNamesFunc } from './PlaylistsState';
import { albumByKeyFuncFam, artistByKeyFuncFam } from './ReadOnly';
import { repeatState, shuffleState } from './ReadWrite';

const log = MakeLogger('api'); // eslint-disable-line
const err = MakeError('ReadWrite-err'); // eslint-disable-line

export type MyTransactionInterface = {
  get: <T>(recoilVal: RecoilState<T> | RecoilValueReadOnly<T>) => T;
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void;
  reset: <T>(recoilVal: RecoilState<T>) => void;
};

type FnType<Args extends readonly unknown[], Return> = (
  ...args: Args
) => Return;

// I'm making my own hook to use instead of the currently-too-constrained
// useRecoilTransaction hook
export function useMyTransaction<Args extends readonly unknown[], Return>(
  fn: (ntrface: MyTransactionInterface) => FnType<Args, Return>,
): FnType<Args, Return> {
  return useRecoilCallback(({ set, reset, snapshot }) => {
    const get = <T>(recoilVal: RecoilState<T> | RecoilValueReadOnly<T>) =>
      snapshot.getLoadable(recoilVal).getValue();
    return fn({ set, reset, get });
  });
}

function ShufflePlayback(
  { get, set }: MyTransactionInterface,
  songList: SongKey[],
): void {
  const shuffle = get(shuffleState);
  if (shuffle) {
    // The [...Array(XXX).keys()] creates an arry from 0 to XXX :)
    set(
      songPlaybackOrderState,
      ShuffleArray([...Array(songList.length).keys()]),
    );
  }
}

/**
 * Try to play the next song in the playlist
 * This function handles repeat & shuffle (thus they're required parameters...)
 *
 * @param {TransactionInterface} {get, set} - the Recoil Transaction interface
 *
 * @returns {Promise<boolean>} true if the next song started playing,
 *  false otherwise
 */
export function MaybePlayNext(xact: MyTransactionInterface): boolean {
  const { get, set } = xact;
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
  ShufflePlayback(xact, songList);
  set(currentIndexState, 0);
  return true;
}

/**
 * Try to play the 'previous' song, considering repeat possibilities
 *
 * @param {TransactionInterface} {get, set} - the Recoil Transaction interface
 *
 * @returns Promise<void>
 */
export function MaybePlayPrev({ get, set }: MyTransactionInterface): void {
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
 * @param {TransactionInterface} xact - the Recoil Transaction interface
 * @param {Iterable<SongKey>} listToFilter - The list of songs to add
 *
 * @returns {SongKey[]} The filtered list of songs
 */
function GetFilteredSongs(
  xact: MyTransactionInterface,
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
 * @param {TransactionInterface} xact - the Recoil Transaction interface
 * @param {Iterable<SongKey>} listToAdd - The list of songs to add
 *
 * @returns void
 */
export function AddSongs( // Deprecate this: It's only for tests now :/
  xact: MyTransactionInterface,
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
export function PlaySongs(
  xact: MyTransactionInterface,
  listToPlay: Iterable<SongKey>,
  playlistName?: PlaylistName,
): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { set } = xact;
  const playList = GetFilteredSongs(xact, listToPlay);
  ShufflePlayback(xact, playList);
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
export function StopAndClear({ reset }: MyTransactionInterface): void {
  reset(songListState);
  reset(currentIndexState);
  reset(activePlaylistState);
  reset(mediaTimeState);
  reset(playingState);
  reset(songPlaybackOrderState);
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
}: MyTransactionInterface): void {
  const curIndex = get(currentIndexState);
  reset(nowPlayingSortState);
  const curSongList = get(songListState);
  if (curIndex < 0) {
    ShufflePlayback({ get, set, reset }, curSongList);
  } else {
    const notNowPlaying = [...(Array(curSongList.length - 1) as unknown[])].map(
      (_, idx) => (idx >= curIndex ? idx + 1 : idx),
    );
    const newSongs = ShuffleArray(notNowPlaying);
    // Re-insert curIndex back at the beginning of the array
    set(songPlaybackOrderState, [curIndex, ...newSongs]);
    reset(nowPlayingSortState);
  }
}

/**
 * Rename a playlist (make sure you've got the name right)
 **/
export function RenamePlaylist(
  { set, get }: MyTransactionInterface,
  curName: PlaylistName,
  newName: PlaylistName,
): void {
  const curNames = get(playlistNamesFunc);
  const curSongs = get(playlistFuncFam(curName));
  curNames.delete(curName);
  curNames.add(newName);
  set(playlistFuncFam(newName), curSongs);
  set(playlistNamesFunc, new Set(curNames));
  void PostMain('rename-playlist', [curName, newName]);
}

/**
 * Delete a playlist (make sure you've got the name right)
 **/
export function DeletePlaylist(
  { set, get }: MyTransactionInterface,
  toDelete: PlaylistName,
): void {
  const curNames = get(playlistNamesFunc);
  const activePlaylist = get(activePlaylistState);
  curNames.delete(toDelete);
  set(playlistNamesFunc, new Set(curNames));
  if (activePlaylist === toDelete) {
    set(activePlaylistState, '');
  }
  void PostMain('delete-playlist', toDelete);
}

export function SongListFromKey(
  { get }: MyTransactionInterface,
  data: MediaKey,
): SongKey[] {
  if (data.length === 0) {
    return [];
  }
  if (isSongKey(data)) {
    return [data];
  }
  if (isAlbumKey(data)) {
    const alb = get(albumByKeyFuncFam(data));
    return alb ? alb.songs : [];
  }
  if (isArtistKey(data)) {
    const art = get(artistByKeyFuncFam(data));
    return art ? art.songs : [];
  }
  return [];
}
