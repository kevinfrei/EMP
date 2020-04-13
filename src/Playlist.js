// @flow
// @format
import ShuffleArray from './ShuffleArray';

import type { Store } from 'undux';
import type { State, Song, SongKey, PlaySet } from './MyStore';

// Playlists are a named ordered (?) list of songs
// Literally: Map<string, Array<SongKey>>

// PlaySet is a playlist name, an ordered list of offsets,
// a position into that list of offsets
// { name: string, position: number, songList: Array<number> }
// This allows for shuffling & repeating

export const PlayingPlaylist = (playSet: PlaySet) => playSet.name.length !== 0;

// If a playlist is playing, clear the playlist
// If a playlist isn't playing, prepend to the nowPlaying list
export const PlaySong = (store: Store<State>, key: SongKey) => {
  store.set('curSong')(key);
  const nowPlaying = store.get('nowPlaying');
  if (PlayingPlaylist(nowPlaying)) {
    nowPlaying.songs = [key];
    nowPlaying.name = '';
  } else {
    nowPlaying.songs.unshift(key);
  }
  nowPlaying.pos = 0;
  store.set('nowPlaying')(nowPlaying);
};

// Just add a specific song to the now playing set
export const AddSong = (store: Store<State>, key: SongKey) => {
  const nowPlaying = store.get('nowPlaying');
  nowPlaying.songs.push(key);
  store.set('nowPlaying')(nowPlaying);
};

// Adds a song to a specific playlist
// If that playlist is playing, add it to the end of the playset as well
export const AddToPlaylist = (
  store: Store<State>,
  key: SongKey,
  playlist: string
) => {
  const playlists = store.get('Playlists');
  const thisOne = playlists.get(playlist);
  if (!thisOne) {
    console.log('Attempt to add to a non-existent playlist');
    return;
  }
  // TODO: If we already got one, maybe ask for confirmation?
  const index = thisOne.length;
  thisOne.push(key);
  const nowPlaying = store.get('nowPlaying');
  if (nowPlaying.name === playlist) {
    nowPlaying.songs.push(index);
    store.set('nowPlaying')(nowPlaying);
  }
};

export const GetSongKey = (
  store: Store<State>,
  playing: PlaySet,
  pos: number
): SongKey => {
  const next = playing.songs[pos];
  if (typeof next === 'string') {
    return next;
  } else {
    const list = store.get('Playlists').get(playing.name);
    if (!list) {
      // We didn't find the playlist
      console.log('Attempting to play from a non-existent playlist');
      return '';
    }
    return list[next];
  }
  console.log('Unable to get the song key ${pos} from:');
  console.log(playing);
  return '';
};

// Moves the current playset forward
// Should handle repeat & shuffle as well
export const StartNextSong = (store: Store<State>) => {
  const nowPlaying = store.get('nowPlaying');
  if (nowPlaying.pos < 0) {
    return;
  }
  // Scooch to the next song
  nowPlaying.pos++;
  if (nowPlaying.pos >= nowPlaying.songs.length) {
    // If we've past the end of the list, check to see if we're repeating
    const repeat = store.get('repeat');
    if (!repeat) {
      return;
    }
    nowPlaying.pos = 0;
    if (store.get('shuffle')) {
      nowPlaying.songs = ShuffleArray(nowPlaying.songs);
    }
  }
  // K, we've got pos moved forward, let's queue up the song
  const songKey = GetSongKey(store, nowPlaying, nowPlaying.pos);
  store.set('curSong')(songKey);
  store.set('nowPlaying')(nowPlaying);
};

// Moves the current playset backward
export const StartPrevSong = (store: Store<State>) => {
  const nowPlaying = store.get('nowPlaying');
  if (nowPlaying.pos < 0) {
    return;
  }
  // Scooch to the next song
  nowPlaying.pos--;
  if (nowPlaying.pos < 0) {
    // If we've past the end of the list, check to see if we're repeating
    const repeat = store.get('repeat');
    if (!repeat) {
      return;
    }
    nowPlaying.pos = nowPlaying.songs.length - 1;
  }
  // K, we've got pos moved forward, let's queue up the song
  const songKey = GetSongKey(store, nowPlaying, nowPlaying.pos);
  store.set('curSong')(songKey);
  store.set('nowPlaying')(nowPlaying);
};