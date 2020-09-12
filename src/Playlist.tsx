import ShuffleArray from './ShuffleArray';
import { Logger } from '@freik/core-utils';

import type { Store } from 'undux';
import type {
  State,
  SongKey,
  StoreState,
} from './MyStore';

const log = Logger.bind('Playlist.tsx');
Logger.disable('Playlist.tsx');

// Playlists are a named ordered (?) list of songs
// Literally: Map<string, SongKey[]>

// PlaySet is a playlist name, an ordered list of offsets,
// a position into that list of offsets
// { name: string, position: number, songList: number[] }
// This allows for shuffling & repeating


// Adds a song to a specific playlist
// If that playlist is playing, add it to the end of the playset as well
export function AddToPlaylist(
  store: Store<State>,
  key: SongKey,
  playlist: string,
): void {
  const playlists = store.get('Playlists');
  const thisOne = playlists.get(playlist);
  if (!thisOne) {
    log('Attempt to add to a non-existent playlist');
    return;
  }
  // TODO: If this song is already in the list, maybe ask for confirmation?
  thisOne.push(key);
  playlists.set(playlist, thisOne);
  store.set('Playlists')(playlists);
  const activePlaylist = store.get('activePlaylistName');
  if (activePlaylist === playlist) {
    const songList = store.get('songList');
    songList.push(key);
    store.set('songList')(songList);
  }
}

// This shuffles now playing without changing what's currently playing
// If something is playing, it's the first song in the shuffled playlist
export function ShuffleNowPlaying(store: Store<State>): void {
  let songList = store.get('songList');
  // Special casing this makes things much easier:
  const curIndex = store.get('curIndex');
  if (curIndex < 0) {
    songList = ShuffleArray(songList);
  } else {
    // if we're currently playing something, remove it from the array
    const curKey = songList[curIndex];
    songList.splice(curIndex, 1);
    songList = [curKey, ...ShuffleArray(songList)];
    store.set('curIndex')(0);
  }
  store.set('songList')(songList);
}

// Moves the current playset forward
// Should handle repeat & shuffle as well
export function StartNextSong(
  store: Store<State>,
  shuffle: boolean,
  repeat: boolean,
): void {
  let curIndex = store.get('curIndex');
  if (curIndex < 0) {
    return;
  }
  // Scooch to the next song
  curIndex++;
  let songList = store.get('songList');
  if (curIndex >= songList.length) {
    // If we've past the end of the list, check to see if we're repeating
    if (!repeat) {
      store.set('curIndex')(-1);
      return;
    }
    curIndex = 0;
    if (shuffle) {
      songList = ShuffleArray(songList);
      store.set('songList')(songList);
    }
  }
  // K, we've got pos moved forward, let's queue up the song
//  StartSongPlaying(store, curIndex);
}

// Moves the current playset backward
export function StartPrevSong(store: StoreState, repeat: boolean): void {
  let curIndex = store.get('curIndex');
  if (curIndex < 0) {
    return;
  }
  // Scooch to the next song
  curIndex--;
  const songList = store.get('songList');
  if (curIndex < 0) {
    // If we've past the end of the list, check to see if we're repeating
    if (!repeat) {
      store.set('curIndex')(-1);
      return;
    }
    curIndex = songList.length - 1;
  }
  // K, we've got pos moved forward, let's queue up the song
//  StartSongPlaying(store, curIndex);
}

export function StartPlaylist(store: StoreState, name: string): void {
  const pl = store.get('Playlists');
  const thePl = pl.get(name);
  if (!thePl) {
    log(`Invalid playlist name ${name}`);
    return;
  }
  store.set('activePlaylistName')(name);
  store.set('songList')([...thePl]);
//  StartSongPlaying(store, 0);
}
