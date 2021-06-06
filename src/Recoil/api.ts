import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import {
  isAlbumKey,
  isArtistKey,
  isSongKey,
  MediaKey,
  PlaylistName,
  SongKey,
} from '@freik/media-core';
import { CallbackInterface, RecoilState, Snapshot } from 'recoil';
import { PostMain } from '../MyWindow';
import { isPlaylist, ShuffleArray } from '../Tools';
import {
  neverPlayHatesState,
  onlyPlayLikesState,
  songHateFamily,
  songLikeFamily,
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

// A helper for snapshot value loading
function getVal<T>(snapshot: Snapshot, atomOrSel: RecoilState<T>): T {
  return snapshot.getLoadable(atomOrSel).valueOrThrow();
}

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
  const release = snapshot.retain();
  try {
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
  } finally {
    release();
  }
}

/**
 * Try to play the 'previous' song, considering repeat possibilities
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns Promise<void>
 */
export async function MaybePlayPrev({
  snapshot,
  set,
}: CallbackInterface): Promise<void> {
  const release = snapshot.retain();
  try {
    const songList = await snapshot.getPromise(songListState);
    if (songList.length > 0) {
      const curIndex = await snapshot.getPromise(currentIndexState);
      if (curIndex > 0) {
        set(currentIndexState, curIndex - 1);
      } else if (await snapshot.getPromise(repeatState)) {
        set(currentIndexState, songList.length - 1);
      }
    }
  } finally {
    release();
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
function GetFilteredSongsSync( // Deprecated
  snapshot: Snapshot,
  listToFilter: Iterable<SongKey>,
): SongKey[] {
  const onlyLikes = getVal(snapshot, onlyPlayLikesState);
  const neverHates = getVal(snapshot, neverPlayHatesState);
  const playList = [...listToFilter];
  const filtered = playList.filter((songKey: SongKey) => {
    if (onlyLikes) {
      return getVal(snapshot, songLikeFamily(songKey));
    }
    if (neverHates) {
      return !getVal(snapshot, songHateFamily(songKey));
    }
    return true;
  });
  return filtered.length === 0 ? playList : filtered;
}

// The snapshot needs to already be retained!
async function GetFilteredSongs(
  snapshot: Snapshot,
  listToFilter: Iterable<SongKey>,
): Promise<SongKey[]> {
  const onlyLikes = await snapshot.getPromise(onlyPlayLikesState);
  const neverHates = await snapshot.getPromise(neverPlayHatesState);
  const playList = [...listToFilter];
  const filtered = await Promise.all(
    playList.filter((songKey: SongKey) => {
      if (onlyLikes) {
        return snapshot.getPromise(songLikeFamily(songKey));
      }
      if (neverHates) {
        return snapshot.getPromise(songHateFamily(songKey)).then((val) => !val);
      }
      return true;
    }),
  );
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
export function AddSongsSync( // Deprecate this: It's only for tests now :/
  { snapshot, set }: CallbackInterface,
  listToAdd: Iterable<SongKey>,
): void {
  const shuffle = getVal(snapshot, shuffleState);
  const playList = GetFilteredSongsSync(snapshot, listToAdd);
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
export async function AddSongs(
  { snapshot, set }: CallbackInterface,
  listToAdd: Iterable<SongKey>,
): Promise<void> {
  const release = snapshot.retain();
  try {
    const shuffle = await snapshot.getPromise(shuffleState);
    const playList = await GetFilteredSongs(snapshot, listToAdd);
    if (!shuffle) {
      set(songListState, (songList: string[]) => [...songList, ...listToAdd]);
      set(currentIndexState, (curIndex) => (curIndex < 0 ? 0 : curIndex));
    } else {
      const shuffledList = ShuffleArray(playList);
      set(songListState, (songList: string[]) => [
        ...songList,
        ...shuffledList,
      ]);
      set(currentIndexState, (curIndex) => (curIndex < 0 ? 0 : curIndex));
    }
    set(recentlyQueuedState, playList.length);
    set(displayMessageState, true);
  } finally {
    release();
  }
}

/**
 * Adds a list of songs to the end of the current song list
 *
 * @param  {Iterable<SongKey>} listToPlay - The list of songs to start playing
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export function PlaySongsSync( // Deprecate this: It's only for tests now :/
  { set, snapshot }: CallbackInterface,
  listToPlay: Iterable<SongKey>,
  playlistName?: PlaylistName,
): void {
  let playList = GetFilteredSongsSync(snapshot, listToPlay);
  const shuffle = getVal(snapshot, shuffleState);
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

export async function PlaySongs(
  { set, snapshot }: CallbackInterface,
  listToPlay: Iterable<SongKey>,
  playlistName?: PlaylistName,
): Promise<void> {
  const release = snapshot.retain();
  try {
    let playList = await GetFilteredSongs(snapshot, listToPlay);
    const shuffle = await snapshot.getPromise(shuffleState);
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
  } finally {
    release();
  }
}

/**
 * Stop playback and clears the active playlist
 * It's pretty dumb in that it just calls a bunch of resetter's :/
 *
 * @param {CallbackInterface} callbackInterface - a Recoil Callback interface
 *
 * @returns void
 */
export function StopAndClear({ reset }: CallbackInterface): void {
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
export async function ShufflePlaying({
  snapshot,
  reset,
  set,
}: CallbackInterface): Promise<void> {
  const release = snapshot.retain();
  try {
    const curIndex = await snapshot.getPromise(currentIndexState);
    reset(nowPlayingSortState);
    if (curIndex < 0) {
      set(songListState, (prevSongList: string[]) =>
        ShuffleArray(prevSongList),
      );
    } else {
      const curSongList = await snapshot.getPromise(songListState);
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
  } finally {
    release();
  }
}

/**
 * Rename a playlist (make sure you've got the name right)
 **/
export async function RenamePlaylist(
  { set, snapshot }: CallbackInterface,
  curName: PlaylistName,
  newName: PlaylistName,
): Promise<void> {
  const release = snapshot.retain();
  try {
    const curNames = await snapshot.getPromise(playlistNamesState);
    const curSongs = await snapshot.getPromise(getPlaylistFamily(curName));
    curNames.delete(curName);
    curNames.add(newName);
    await PostMain('rename-playlist', [curName, newName]);
    set(getPlaylistFamily(newName), curSongs);
    set(playlistNamesState, new Set(curNames));
  } finally {
    release();
  }
}

/**
 * Delete a playlist (make sure you've got the name right)
 **/
export async function DeletePlaylist(
  { set, snapshot }: CallbackInterface,
  toDelete: PlaylistName,
): Promise<void> {
  const release = snapshot.retain();
  try {
    const curNames = await snapshot.getPromise(playlistNamesState);
    const activePlaylist = await snapshot.getPromise(activePlaylistState);
    curNames.delete(toDelete);
    await PostMain('delete-playlist', toDelete);
    set(playlistNamesState, new Set(curNames));
    if (activePlaylist === toDelete) {
      set(activePlaylistState, '');
    }
  } finally {
    release();
  }
}

export async function SongListFromKey(
  { snapshot }: CallbackInterface,
  data: MediaKey,
): Promise<SongKey[]> {
  if (data.length === 0) {
    return [];
  }
  if (isSongKey(data)) {
    return [data];
  }
  const release = snapshot.retain();
  try {
    if (isAlbumKey(data)) {
      const alb = await snapshot.getPromise(getAlbumByKeyFamily(data));
      return alb ? alb.songs : [];
    }
    if (isArtistKey(data)) {
      const art = await snapshot.getPromise(getArtistByKeyFamily(data));
      return art ? art.songs : [];
    }
  } finally {
    release();
  }
  return [];
}
