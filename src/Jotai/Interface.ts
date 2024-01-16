import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { PlaylistName, SongKey } from '@freik/media-core';
import { isNumber } from '@freik/typechk';
import { RESET } from 'jotai/utils';
import {
  displayMessageState,
  nowPlayingSortState,
  recentlyQueuedState,
} from '../Jotai/Local';
import { mediaTimeState, playingState } from '../Jotai/MediaPlaying';
import { MyStore } from '../Jotai/Storage';
import { ShuffleArray, isPlaylist } from '../Tools';
import {
  isSongHatedFam,
  isSongLikedFam,
  neverPlayHatesState,
  onlyPlayLikesState,
  songHateFuncFam,
} from './Likes';
import { playlistFuncFam, playlistNamesFunc } from './Playlists';
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
    await ShufflePlaying(store, true);
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
export async function PlaySongs(
  store: MyStore,
  listToPlay: Iterable<SongKey>,
  playlistName?: PlaylistName,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const playList = await GetFilteredSongs(store, listToPlay);
  if (isPlaylist(playlistName)) {
    await store.set(activePlaylistState, playlistName);
  } else {
    await store.set(activePlaylistState, RESET);
  }
  const shuffle = await store.get(shuffleState);
  if (shuffle) {
    await store.set(
      songPlaybackOrderState,
      ShuffleArray(Array.from(playList, (_, idx) => idx)),
    );
  }
  await store.set(songListState, [...playList]);
  await store.set(currentIndexState, playList.length >= 0 ? 0 : -1);
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
export async function StopAndClear(store: MyStore): Promise<void> {
  await store.set(songListState, RESET);
  await store.set(currentIndexState, RESET);
  await store.set(activePlaylistState, RESET);
  store.set(mediaTimeState, RESET);
  store.set(playingState, RESET);
  await store.set(songPlaybackOrderState, RESET);
}

/**
 * This shuffles now playing without changing what's currently playing
 * If something is playing, it's the first song in the shuffled playlist
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 */
export async function ShufflePlaying(
  store: MyStore,
  ignoreCur?: boolean,
): Promise<void> {
  ignoreCur = ignoreCur === true;
  const curIndex = await store.get(currentIndexState);
  const curSongList = await store.get(songListState);
  if (curIndex < 0 || ignoreCur) {
    const nums = Array.from(curSongList, (_, idx) => idx);
    await store.set(songPlaybackOrderState, ShuffleArray(nums));
  } else {
    // Make an array skipping the current index (with an extra at the end...)
    const notNowPlaying = Array.from(curSongList, (_, idx) =>
      idx >= curIndex ? idx + 1 : idx,
    );
    // Remove the extra at the end
    notNowPlaying.pop();
    const newSongs = ShuffleArray(notNowPlaying);
    // Re-insert curIndex back at the beginning of the array
    await store.set(songPlaybackOrderState, [curIndex, ...newSongs]);
  }
  if (curSongList.length > 0) {
    await store.set(currentIndexState, 0);
  }
  store.set(nowPlayingSortState, RESET);
}

/**
 * Rename a playlist (make sure you've got the name right)
 **/
export async function RenamePlaylist(
  store: MyStore,
  curName: PlaylistName,
  newName: PlaylistName,
): Promise<void> {
  const curNames = await store.get(playlistNamesFunc);
  const curSongs = await store.get(playlistFuncFam(curName));
  if (curSongs === RESET) {
    return;
  }
  curNames.delete(curName);
  curNames.add(newName);
  await store.set(playlistFuncFam(newName), curSongs);
  await store.set(playlistNamesFunc, new Set(curNames));
  void Ipc.PostMain(IpcId.RenamePlaylist, [curName, newName]);
}

/**
 * Delete a playlist (make sure you've got the name right)
 **/
export async function DeletePlaylist(
  store: MyStore,
  toDelete: PlaylistName,
): Promise<void> {
  const curNames = await store.get(playlistNamesFunc);
  const activePlaylist = await store.get(activePlaylistState);
  curNames.delete(toDelete);
  await store.set(playlistNamesFunc, new Set(curNames));
  if (activePlaylist === toDelete) {
    await store.set(activePlaylistState, '');
  }
  void Ipc.PostMain(IpcId.DeletePlaylist, toDelete);
}

export async function RemoveSongFromNowPlaying(
  store: MyStore,
  indexOrKey: number | SongKey,
): Promise<void> {
  // If we're going to be removing a song before the current index
  // we need to move the curIndex pointer as well
  const songList = await store.get(songListState);
  const listLocation = isNumber(indexOrKey)
    ? indexOrKey
    : songList.indexOf(indexOrKey);
  const curSongIndex = await store.get(currentIndexState);
  if (listLocation < curSongIndex) {
    await store.set(currentIndexState, curSongIndex - 1);
  }
  await store.set(
    songListState,
    songList.filter((v, i) => i !== listLocation),
  );
}
