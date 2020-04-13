// @flow
// @format
import ShuffleArray from './ShuffleArray';
import { StartSongPlaying } from './SongPlayback';

import type { Store } from 'undux';
import type {
  State,
  Song,
  SongKey,
  PlaySet,
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
} from './MyStore';

// Playlists are a named ordered (?) list of songs
// Literally: Map<string, Array<SongKey>>

// PlaySet is a playlist name, an ordered list of offsets,
// a position into that list of offsets
// { name: string, position: number, songList: Array<number> }
// This allows for shuffling & repeating

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
};

export const PlayingPlaylist = (playSet: PlaySet) => playSet.name.length !== 0;

// If a playlist is playing, clear the playlist
// If a playlist isn't playing, prepend to the nowPlaying list
export const PlaySong = (store: Store<State>, key: SongKey) => {
  const nowPlaying = store.get('nowPlaying');
  if (PlayingPlaylist(nowPlaying)) {
    nowPlaying.songs = [key];
    nowPlaying.name = '';
  } else {
    nowPlaying.songs.unshift(key);
  }
  nowPlaying.pos = 0;
  store.set('nowPlaying')(nowPlaying);
  StartSongPlaying(store, key);
};

export const PlaySongNumber = (store: Store<State>, index: number) => {
  const nowPlaying = store.get('nowPlaying');
  nowPlaying.pos = index;
  store.set('nowPlaying')(nowPlaying);
  StartSongPlaying(store, GetSongKey(store, nowPlaying, index));
};

const JustAddSong = (store: Store<State>, key: SongKey) => {
  const nowPlaying = store.get('nowPlaying');
  nowPlaying.songs.push(key);
  store.set('nowPlaying')(nowPlaying);
};

// Just add a specific song to the now playing set
export const AddSong = (store: Store<State>, key: SongKey) => {
  const nowPlaying = store.get('nowPlaying');
  nowPlaying.songs.push(key);
  if (store.get('curSong') === '' || nowPlaying.pos < 0) {
    nowPlaying.pos = nowPlaying.songs.length - 1;
    StartSongPlaying(store, key);
  }
  store.set('nowPlaying')(nowPlaying);
};

const AddSongList = (store: Store<State>, keys: Array<SongKey>) => {
  const nowPlaying = store.get('nowPlaying');
  const prevPos = nowPlaying.pos;
  keys.forEach((k) => JustAddSong(store, k));
  if (store.get('curSong') === '' || prevPos < 0) {
    nowPlaying.pos = Math.max(prevPos, 0);
    const key = GetSongKey(store, nowPlaying, nowPlaying.pos);
    StartSongPlaying(store, key);
  }
};

export const AddAlbum = (store: Store<State>, key: AlbumKey) => {
  const album = store.get('Albums').get(key);
  if (album) {
    AddSongList(store, album.songs);
  }
};

export const AddArtist = (store: Store<State>, key: ArtistKey) => {
  const artist = store.get('Artists').get(key);
  if (artist) {
    AddSongList(store, artist.songs);
  }
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

// This shuffles now playing without changing what's currently playing
export const ShuffleNowPlaying = (store: Store<State>) => {
  const nowPlaying = store.get('nowPlaying');
  // Special casing this makes things much easier:
  if (nowPlaying.pos < 0) {
    nowPlaying.songs = ShuffleArray(nowPlaying.songs);
  } else {
    const curPlaying = nowPlaying.pos;
    // if we're currently playing something, remove it from the array
    const curKey = nowPlaying.songs[nowPlaying.pos];
    nowPlaying.songs.splice(nowPlaying.pos, 1);
    nowPlaying.songs = [curKey, ...ShuffleArray(nowPlaying.songs)];
    nowPlaying.pos = 0;
  }
  store.set('nowPlaying')(nowPlaying);
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
  store.set('nowPlaying')(nowPlaying);
  StartSongPlaying(store, songKey);
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
  store.set('nowPlaying')(nowPlaying);
  StartSongPlaying(store, songKey);
};
