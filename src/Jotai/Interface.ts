import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { PlaylistName, SongKey } from '@freik/media-core';
import { isNumber } from '@freik/typechk';
import { RESET } from 'jotai/utils';
import {
  displayMessageAtom,
  nowPlayingSortAtom,
  recentlyQueuedAtom,
} from '../Jotai/Local';
import { mediaTimeAtom, playingAtom } from '../Jotai/MediaPlaying';
import { ShuffleArray, isPlaylist } from '../Tools';
import { MyStore } from './Helpers';
import {
  isSongHatedAtomFam,
  isSongLikedAtomFam,
  neverPlayHatesAtom,
  onlyPlayLikesAtom,
  songHateAtomFam,
} from './Likes';
import { playlistAtomFam, playlistNamesAtom } from './Playlists';
import { repeatAtom, shuffleAtom } from './SimpleSettings';
import {
  activePlaylistAtom,
  currentIndexAtom,
  currentSongKeyAtom,
  songListAtom,
  songPlaybackOrderAtom,
} from './SongsPlaying';

// const { err, log } = MakeLog('EMP:render:api');

/**
 * Try to play the next song in the playlist
 * This function handles repeat & shuffle (thus they're required parameters...)
 *
 * @param {store} The Jotai store interface
 *
 * @returns {Promise<boolean>} true if the next song started playing,
 *  false otherwise
 */
export async function MaybePlayNext(
  store: MyStore,
  dislike = false,
): Promise<boolean> {
  const curIndex = await store.get(currentIndexAtom);
  const songList = await store.get(songListAtom);
  const curSong = await store.get(currentSongKeyAtom);
  if (dislike) {
    await store.set(songHateAtomFam(curSong), true);
    if (await store.get(neverPlayHatesAtom)) {
      await RemoveSongFromNowPlaying(store, curSong);
    }
  }
  if (curIndex + 1 < songList.length) {
    await store.set(currentIndexAtom, curIndex + 1);
    return true;
  }
  const repeat = await store.get(repeatAtom);
  if (!repeat) {
    return false;
  }
  if (await store.get(shuffleAtom)) {
    await ShufflePlaying(store, true);
  }
  await store.set(currentIndexAtom, 0);
  return true;
}

/**
 * Try to play the 'previous' song, considering repeat possibilities
 *
 * @param {store} The Jotai store interface
 *
 * @returns Promise<void>
 */
export async function MaybePlayPrev(store: MyStore): Promise<void> {
  const songList = await store.get(songListAtom);
  if (songList.length > 0) {
    const curIndex = await store.get(currentIndexAtom);
    if (curIndex > 0) {
      await store.set(currentIndexAtom, curIndex - 1);
    } else if (await store.get(repeatAtom)) {
      await store.set(currentIndexAtom, songList.length - 1);
    }
  }
}

/**
 * Filters down the list of songs to play according to filter preferences
 *
 * @param {store} The Jotai store interface
 * @param {Iterable<SongKey>} listToFilter - The list of songs to add
 *
 * @returns {SongKey[]} The filtered list of songs
 */
async function GetFilteredSongs(
  store: MyStore,
  listToFilter: Iterable<SongKey>,
): Promise<SongKey[]> {
  const onlyLikes = await store.get(onlyPlayLikesAtom);
  const neverHates = await store.get(neverPlayHatesAtom);
  const playList = [...listToFilter];
  const filtered: SongKey[] = [];
  for (const songKey of playList) {
    if (
      (onlyLikes && (await store.get(isSongLikedAtomFam(songKey)))) ||
      (neverHates && !(await store.get(isSongHatedAtomFam(songKey))))
    ) {
      filtered.push(songKey);
    }
  }
  return filtered.length === 0 ? playList : filtered;
}

/**
 * Adds a list of songs to the end of the current song list
 *
 * @param {store} The Jotai store interface
 * @param {Iterable<SongKey>} listToAdd - The list of songs to add
 *
 * @returns void
 */
export async function AddSongs(
  store: MyStore,
  listToAdd: Iterable<SongKey>,
  playlistName?: string,
): Promise<void> {
  const songList = await store.get(songListAtom);
  if (songList.length === 0) {
    // This makes it so that if you add, it will still register as
    // the playlist you added, if the current playlist is empty
    await PlaySongs(store, listToAdd, playlistName);
  }
  const shuffle = await store.get(shuffleAtom);
  const playList = await GetFilteredSongs(store, listToAdd);
  const fullList = [...songList, ...playList];
  await store.set(songListAtom, fullList);
  if (shuffle) {
    // If we're shuffled, shuffle in to the "rest" of the current play order
    const playOrder = await store.get(songPlaybackOrderAtom);
    const curIdx = await store.get(currentIndexAtom);
    if (
      playOrder === 'ordered' || // We can wind up here if the shuffle was true at start :/
      curIdx < 0
    ) {
      // No current song playing: Just shuffle & be done
      await store.set(
        songPlaybackOrderAtom,
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
      await store.set(songPlaybackOrderAtom, [
        ...alreadyPlayed,
        ...ShuffleArray(leftToPlay),
      ]);
    }
  }
  store.set(recentlyQueuedAtom, playList.length);
  store.set(displayMessageAtom, true);
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
    await store.set(activePlaylistAtom, playlistName);
  } else {
    await store.set(activePlaylistAtom, RESET);
  }
  const shuffle = await store.get(shuffleAtom);
  if (shuffle) {
    await store.set(
      songPlaybackOrderAtom,
      ShuffleArray(Array.from(playList, (_, idx) => idx)),
    );
  }
  await store.set(songListAtom, [...playList]);
  await store.set(currentIndexAtom, playList.length >= 0 ? 0 : -1);
  store.set(recentlyQueuedAtom, playList.length);
  store.set(displayMessageAtom, true);
}

/**
 * Stop playback and clears the active playlist
 * It's pretty dumb in that it just calls a bunch of resetter's :/
 *
 * @param {store} The Jotai store interface
 *
 * @returns void
 */
export async function StopAndClear(store: MyStore): Promise<void> {
  await store.set(songListAtom, RESET);
  await store.set(currentIndexAtom, RESET);
  await store.set(activePlaylistAtom, RESET);
  store.set(mediaTimeAtom, RESET);
  store.set(playingAtom, RESET);
  await store.set(songPlaybackOrderAtom, RESET);
}

/**
 * This shuffles now playing without changing what's currently playing
 * If something is playing, it's the first song in the shuffled playlist
 *
 * @param {store} The Jotai store interface
 */
export async function ShufflePlaying(
  store: MyStore,
  ignoreCur?: boolean,
): Promise<void> {
  ignoreCur = ignoreCur === true;
  const curIndex = await store.get(currentIndexAtom);
  const curSongList = await store.get(songListAtom);
  if (curIndex < 0 || ignoreCur) {
    const nums = Array.from(curSongList, (_, idx) => idx);
    await store.set(songPlaybackOrderAtom, ShuffleArray(nums));
  } else {
    // Make an array skipping the current index (with an extra at the end...)
    const notNowPlaying = Array.from(curSongList, (_, idx) =>
      idx >= curIndex ? idx + 1 : idx,
    );
    // Remove the extra at the end
    notNowPlaying.pop();
    const newSongs = ShuffleArray(notNowPlaying);
    // Re-insert curIndex back at the beginning of the array
    await store.set(songPlaybackOrderAtom, [curIndex, ...newSongs]);
  }
  if (curSongList.length > 0) {
    await store.set(currentIndexAtom, 0);
  }
  store.set(nowPlayingSortAtom, RESET);
}

/**
 * Rename a playlist (make sure you've got the name right)
 **/
export async function RenamePlaylist(
  store: MyStore,
  curName: PlaylistName,
  newName: PlaylistName,
): Promise<void> {
  const curNames = await store.get(playlistNamesAtom);
  const curSongs = await store.get(playlistAtomFam(curName));
  if (curSongs === RESET) {
    return;
  }
  curNames.delete(curName);
  curNames.add(newName);
  await store.set(playlistAtomFam(newName), curSongs);
  await store.set(playlistNamesAtom, new Set(curNames));
  void Ipc.PostMain(IpcId.RenamePlaylist, [curName, newName]);
}

/**
 * Delete a playlist (make sure you've got the name right)
 **/
export async function DeletePlaylist(
  store: MyStore,
  toDelete: PlaylistName,
): Promise<void> {
  const curNames = await store.get(playlistNamesAtom);
  const activePlaylist = await store.get(activePlaylistAtom);
  curNames.delete(toDelete);
  await store.set(playlistNamesAtom, new Set(curNames));
  if (activePlaylist === toDelete) {
    await store.set(activePlaylistAtom, '');
  }
  void Ipc.PostMain(IpcId.DeletePlaylist, toDelete);
}

export async function RemoveSongFromNowPlaying(
  store: MyStore,
  indexOrKey: number | SongKey,
): Promise<void> {
  // If we're going to be removing a song before the current index
  // we need to move the curIndex pointer as well
  const songList = await store.get(songListAtom);
  const listLocation = isNumber(indexOrKey)
    ? indexOrKey
    : songList.indexOf(indexOrKey);
  const curSongIndex = await store.get(currentIndexAtom);
  if (listLocation < curSongIndex) {
    await store.set(currentIndexAtom, curSongIndex - 1);
  }
  await store.set(
    songListAtom,
    songList.filter((v, i) => i !== listLocation),
  );
}
