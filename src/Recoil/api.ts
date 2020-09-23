import ShuffleArray from '../ShuffleArray';

import type { SongKey } from '@freik/media-utils';

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
  curIndex: number,
  setCurIndex: (val: number) => void,
  repeat: boolean,
  shuffle: boolean,
  songList: SongKey[],
  setSongList: (val: SongKey[]) => void,
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
  curIndex: number,
  setCurIndex: (val: number) => void,
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

/*

TODO: Add playlist support

export const deletePlaylistAtom = atom<string>({
  key: 'DeletePlaylist',
  default: '',
});

export const startPlaylistAtom = atom<string>({
  key: 'StartPlaylist',
  default: '',
});
  // Start playing a particular playlist
  if (startPlaylist.length > 0) {
    const pl = playlists.get(startPlaylist);
    if (pl) {
      setActivePlaylist(startPlaylist);
      setSongList([...pl]);
      // TODO: Check for shuffle play and start by shuffling!
      setCurrentIndex(0);
    }
    resetStartPlaylist();
  }

  if (deletePlaylist !== '') {
    playlists.delete(deletePlaylist);
    setPlaylists(playlists);
    if (deletePlaylist === activePlaylist) {
      resetActivePlaylist();
    }
    resetDeletePlaylist();
  }
*/

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
  curIndex: number,
  setCurIndex: (val: number) => void,
  songList: Iterable<SongKey>,
  setSongList: (val: SongKey[]) => void,
): void {
  setSongList([...songList, ...listToAdd]);
  if (curIndex < 0) {
    setCurIndex(0);
  }
}

/**
 * Stop playback and clears the active playlist
 * It's pretty dumb in that it just calls all the resetter's :/
 *
 * @param  {()=>void} resetSongList
 * @param  {()=>void} resetCurrentIndex
 * @param  {()=>void} resetActivePlaylist
 * @param  {()=>void} resetNowPlaying
 * @returns void
 */
export function StopAndClear(
  resetSongList: () => void,
  resetCurrentIndex: () => void,
  resetActivePlaylist: () => void,
  resetNowPlaying: () => void,
): void {
  resetSongList();
  resetCurrentIndex();
  resetActivePlaylist();
  resetNowPlaying();
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
  currentIndex: number,
  setCurrentIndex: (val: number) => void,
  songList: SongKey[],
  setSongList: (val: SongKey[]) => void,
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
