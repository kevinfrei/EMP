import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import {
  isAlbumKey,
  isArtistKey,
  isSongKey,
  MediaKey,
  PlaylistName,
  SongKey,
} from '@freik/media-core';
import { isNumber } from '@freik/typechk';
import type { MyTransactionInterface } from '@freik/web-utils';
import { RESET } from 'jotai/utils';
import {
  displayMessageState,
  nowPlayingSortState,
  recentlyQueuedState,
} from '../Jotai/Local';
import { mediaTimeState, playingState } from '../Jotai/MediaPlaying';
import { getStore, MyStore } from '../Jotai/Storage';
import { isPlaylist, ShuffleArray } from '../Tools';
import {
  isSongHatedFam,
  isSongLikedFam,
  neverPlayHatesState,
  onlyPlayLikesState,
  songHateFuncFam,
} from './Likes';
import { repeatState, shuffleState } from './SimpleSettings';
import {
  activePlaylistState,
  currentIndexState,
  currentSongKeyFunc,
  songListState,
  songPlaybackOrderState,
} from './SongsPlaying';

// const { err, log } = MakeLog('EMP:render:api');

/**
 * Try to play the next song in the playlist
 * This function handles repeat & shuffle (thus they're required parameters...)
 *
 * @param {TransactionInterface} {get, set} - the Recoil Transaction interface
 *
 * @returns {Promise<boolean>} true if the next song started playing,
 *  false otherwise
 */
export async function MaybePlayNext(
  store: MyStore,
  dislike = false,
): Promise<boolean> {
  const curIndex = await store.get(currentIndexState);
  const songList = await store.get(songListState);
  const curSong = await store.get(currentSongKeyFunc);
  if (dislike) {
    await store.set(songHateFuncFam(curSong), true);
    if (await store.get(neverPlayHatesState)) {
      await RemoveSongFromNowPlaying(store, curSong);
    }
  }
  if (curIndex + 1 < songList.length) {
    await store.set(currentIndexState, curIndex + 1);
    return true;
  }
  const repeat = await store.get(repeatState);
  if (!repeat) {
    return false;
  }
  if (await store.get(shuffleState)) {
    ShufflePlaying(store, true);
  }
  await store.set(currentIndexState, 0);
  return true;
}

/**
 * Try to play the 'previous' song, considering repeat possibilities
 *
 * @param {TransactionInterface} {get, set} - the Recoil Transaction interface
 *
 * @returns Promise<void>
 */
export async function MaybePlayPrev(store: MyStore): Promise<void> {
  const songList = await store.get(songListState);
  if (songList.length > 0) {
    const curIndex = await store.get(currentIndexState);
    if (curIndex > 0) {
      await store.set(currentIndexState, curIndex - 1);
    } else if (await store.get(repeatState)) {
      await store.set(currentIndexState, songList.length - 1);
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
async function GetFilteredSongs(
  store: MyStore,
  listToFilter: Iterable<SongKey>,
): Promise<SongKey[]> {
  const onlyLikes = await store.get(onlyPlayLikesState);
  const neverHates = await store.get(neverPlayHatesState);
  const playList = [...listToFilter];
  const filtered: SongKey[] = [];
  for (const songKey of playList) {
    if (
      (onlyLikes && (await store.get(isSongLikedFam(songKey)))) ||
      (neverHates && !(await store.get(isSongHatedFam(songKey))))
    ) {
      filtered.push(songKey);
    }
  }
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
export async function AddSongs(
  store: MyStore,
  listToAdd: Iterable<SongKey>,
  playlistName?: string,
): Promise<void> {
  const songList = await store.get(songListState);
  if (songList.length === 0) {
    // This makes it so that if you add, it will still register as
    // the playlist you added, if the current playlist is empty
    await PlaySongs(store, listToAdd, playlistName);
  }
  const shuffle = await store.get(shuffleState);
  const playList = await GetFilteredSongs(store, listToAdd);
  const fullList = [...songList, ...playList];
  await store.set(songListState, fullList);
  if (shuffle) {
    // If we're shuffled, shuffle in to the "rest" of the current play order
    const playOrder = await store.get(songPlaybackOrderState);
    const curIdx = await store.get(currentIndexState);
    if (
      playOrder === 'ordered' || // We can wind up here if the shuffle was true at start :/
      curIdx < 0
    ) {
      // No current song playing: Just shuffle & be done
      await store.set(
        songPlaybackOrderState,
        ShuffleArray(Array.from(fullList, (_, idx) => idx)),
      );
    } else {
      // Get the first clump (to *not* shuffle)
      const alreadyPlayed = playOrder.slice(0, curIdx + 1);
      // The second clump (the stuff to mix in)
      const leftToPlay = [
        ...playOrder.slice(curIdx + 1),
        ...Array.from(playList, (_, idx) => songList.length + idx),
      ];
      await store.set(songPlaybackOrderState, [
        ...alreadyPlayed,
        ...ShuffleArray(leftToPlay),
      ]);
    }
  }
  store.set(recentlyQueuedState, playList.length);
  store.set(displayMessageState, true);
}

/**
 * Sets a list of songs as the current song list
 *
 * @param xact - The transaction interface
 * @param listToPlay - The list of songkeys to play (in the order desired)
 * @param playlistName - The playlist name
 */
export function PlaySongs(
  xact: MyTransactionInterface,
  listToPlay: Iterable<SongKey>,
  playlistName?: PlaylistName,
): void {
  const store = getStore();
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { reset, set, get } = xact;
  const playList = GetFilteredSongs(xact, listToPlay);
  if (isPlaylist(playlistName)) {
    set(activePlaylistState, playlistName);
  } else {
    reset(activePlaylistState);
  }
  const shuffle = get(shuffleFunc);
  if (shuffle) {
    set(
      songPlaybackOrderState,
      ShuffleArray(Array.from(playList, (_, idx) => idx)),
    );
  }
  set(songListState, [...playList]);
  set(currentIndexState, playList.length >= 0 ? 0 : -1);
  store.set(recentlyQueuedState, playList.length);
  store.set(displayMessageState, true);
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
  const store = getStore();
  reset(songListState);
  reset(currentIndexState);
  reset(activePlaylistState);
  store.set(mediaTimeState, RESET);
  store.set(playingState, RESET);
  reset(songPlaybackOrderState);
}

/**
 * This shuffles now playing without changing what's currently playing
 * If something is playing, it's the first song in the shuffled playlist
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 */
export function ShufflePlaying(
  { get, set }: MyTransactionInterface,
  ignoreCur?: boolean,
): void {
  const store = getStore();
  ignoreCur = ignoreCur === true;
  const curIndex = get(currentIndexState);
  const curSongList = get(songListState);
  if (curIndex < 0 || ignoreCur) {
    const nums = Array.from(curSongList, (_, idx) => idx);
    set(songPlaybackOrderState, ShuffleArray(nums));
  } else {
    // Make an array skipping the current index (with an extra at the end...)
    const notNowPlaying = Array.from(curSongList, (_, idx) =>
      idx >= curIndex ? idx + 1 : idx,
    );
    // Remove the extra at the end
    notNowPlaying.pop();
    const newSongs = ShuffleArray(notNowPlaying);
    // Re-insert curIndex back at the beginning of the array
    set(songPlaybackOrderState, [curIndex, ...newSongs]);
  }
  if (curSongList.length > 0) {
    set(currentIndexState, 0);
  }
  store.set(nowPlayingSortState, RESET);
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
  void Ipc.PostMain(IpcId.RenamePlaylist, [curName, newName]);
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
  void Ipc.PostMain(IpcId.DeletePlaylist, toDelete);
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

export function RemoveSongFromNowPlaying(
  { get, set }: MyTransactionInterface,
  indexOrKey: number | SongKey,
) {
  // If we're going to be removing a song before the current index
  // we need to move the curIndex pointer as well
  const songList = get(songListState);
  const listLocation = isNumber(indexOrKey)
    ? indexOrKey
    : songList.indexOf(indexOrKey);
  const curSongIndex = get(currentIndexState);
  if (listLocation < curSongIndex) {
    set(currentIndexState, curSongIndex - 1);
  }
  set(
    songListState,
    songList.filter((v, i) => i !== listLocation),
  );
}
