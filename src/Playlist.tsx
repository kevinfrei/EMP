// @flow
// @format
import ShuffleArray from './ShuffleArray';
import { StartSongPlaying, StopSongPlaying } from './SongPlayback';

import type { Store } from 'undux';
import type {
  State,
  SongKey,
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  StoreState,
} from './MyStore';

// Playlists are a named ordered (?) list of songs
// Literally: Map<string, SongKey[]>

// PlaySet is a playlist name, an ordered list of offsets,
// a position into that list of offsets
// { name: string, position: number, songList: number[] }
// This allows for shuffling & repeating

// This stops playback and clears the active playlist
export function StopAndClear(store: StoreState): void {
  store.set('songList')([]);
  store.set('curIndex')(-1);
  store.set('activePlaylistName')('');
  StopSongPlaying(store);
}

export function DeletePlaylist(store: StoreState, playlist: string): void {
  const playlists = store.get('Playlists');
  playlists.delete(playlist);
  store.set('Playlists')(playlists);
  if (store.get('activePlaylistName') === playlist) {
    store.set('activePlaylistName')('');
  }
}

// True if we're playing from a playlist and not a random song list
export function PlayingPlaylist(playlistName: string) {
  return playlistName.length > 0;
}

// This starts playing the song index from the songList
export function PlaySongNumber(store: Store<State>, index: number) {
  const songList = store.get('songList');
  if (index < 0 || index >= songList.length) {
    console.log(
      `PlaySongNumber: bounds error: ${index} (of ${songList.length})`,
    );
    return;
  }
  StartSongPlaying(store, index);
}

// Removes the given index from the current songList
// If it's active, move the current to the previous song
export function RemoveSongNumber(store: Store<State>, index: number) {
  const songList = store.get('songList');
  let curIndex = store.get('curIndex');
  songList.splice(index, 1);
  if (curIndex === index && index > 0) {
    PlaySongNumber(store, index - 1);
  } else if (curIndex > index) {
    curIndex--;
    store.set('curIndex')(curIndex);
  }
  store.set('songList')(songList);
}

// Adds a song to the end of the song list
const JustAddSong = (store: Store<State>, key: SongKey) => {
  const songList = store.get('songList');
  songList.push(key);
  store.set('songList')(songList);
};

// Add a specific song to the now playing set. Start it playing if
// nothing's already playing.
export const AddSong = (store: Store<State>, key: SongKey) => {
  JustAddSong(store, key);
  if (store.get('curIndex') < 0) {
    StartSongPlaying(store, 0);
  }
};

const AddSongList = (store: Store<State>, keys: SongKey[]) => {
  keys.forEach((k) => JustAddSong(store, k));
  if (store.get('curIndex') < 0) {
    StartSongPlaying(store, 0);
  }
};

export const AddAlbum = (store: Store<State>, key: AlbumKey) => {
  const album: Album | undefined = store.get('Albums').get(key);
  if (album) {
    AddSongList(store, album.songs);
  }
};

export const AddArtist = (store: Store<State>, key: ArtistKey) => {
  const artist: Artist | undefined = store.get('Artists').get(key);
  if (artist) {
    AddSongList(store, artist.songs);
  }
};

// Adds a song to a specific playlist
// If that playlist is playing, add it to the end of the playset as well
export const AddToPlaylist = (
  store: Store<State>,
  key: SongKey,
  playlist: string,
) => {
  const playlists = store.get('Playlists');
  const thisOne = playlists.get(playlist);
  if (!thisOne) {
    console.log('Attempt to add to a non-existent playlist');
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
};

// This shuffles now playing without changing what's currently playing
// If something is playing, it's the first song in the shuffled playlist
export const ShuffleNowPlaying = (store: Store<State>) => {
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
};

// Moves the current playset forward
// Should handle repeat & shuffle as well
export const StartNextSong = (store: Store<State>) => {
  let curIndex = store.get('curIndex');
  if (curIndex < 0) {
    return;
  }
  // Scooch to the next song
  curIndex++;
  let songList = store.get('songList');
  if (curIndex >= songList.length) {
    // If we've past the end of the list, check to see if we're repeating
    const repeat = store.get('repeat');
    if (!repeat) {
      store.set('curIndex')(-1);
      return;
    }
    curIndex = 0;
    if (store.get('shuffle')) {
      songList = ShuffleArray(songList);
      store.set('songList')(songList);
    }
  }
  // K, we've got pos moved forward, let's queue up the song
  StartSongPlaying(store, curIndex);
};

// Moves the current playset backward
export function StartPrevSong(store: StoreState) {
  let curIndex = store.get('curIndex');
  if (curIndex < 0) {
    return;
  }
  // Scooch to the next song
  curIndex--;
  const songList = store.get('songList');
  if (curIndex < 0) {
    // If we've past the end of the list, check to see if we're repeating
    const repeat = store.get('repeat');
    if (!repeat) {
      store.set('curIndex')(-1);
      return;
    }
    curIndex = songList.length - 1;
  }
  // K, we've got pos moved forward, let's queue up the song
  StartSongPlaying(store, curIndex);
}

export function StartPlaylist(store: StoreState, name: string) {
  const pl = store.get('Playlists');
  const thePl = pl.get(name);
  if (!thePl) {
    console.log(`Invalid playlist name ${name}`);
    return;
  }
  store.set('activePlaylistName')(name);
  store.set('songList')([...thePl]);
  StartSongPlaying(store, 0);
}
