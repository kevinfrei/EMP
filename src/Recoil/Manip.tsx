// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { atom, selector, DefaultValue, useRecoilValue } from 'recoil';
import { GetAudioElem } from '../UI/SongPlayback';
import { Logger } from '@freik/core-utils';

import type { SongKey, AlbumKey, ArtistKey } from '../MyStore';
import {
  AlbumByKey,
  ArtistByKey,
  CurrentIndexAtom,
  NowPlayingAtom,
  PlaylistsAtom,
  SongListAtom,
} from './MusicDbAtoms';
import { activePlaylistAtom } from './Atoms';
import { useRecoilState } from 'recoil';
import { useResetRecoilState } from 'recoil';
import { start } from 'repl';

const log = Logger.bind('Manip.tsx');
Logger.disable('Manip.tsx');

export const StartSongPlayingAtom = atom<number>({
  key: 'StartSongPlaying',
  default: -1,
});

// This stops playback and clears the active playlist
export const StopAndClearAtom = atom<boolean>({
  key: 'StopAndClear',
  default: false,
});

export const DeletePlaylistAtom = atom<string>({
  key: 'DeletePlaylist',
  default: '',
});

// True if we're playing from a playlist and not a random song list
export function PlayingPlaylist(playlistName: string): boolean {
  return playlistName.length > 0;
}

export function Manip(): JSX.Element {
  // "Functions"
  const startSongPlaying = useRecoilValue(StartSongPlayingAtom);
  const stopAndClear = useRecoilValue(StopAndClearAtom);
  const deletePlaylist = useRecoilValue(DeletePlaylistAtom);

  // State input
  const [currentIndex, setCurrentIndex] = useRecoilState(CurrentIndexAtom);

  // Resetters
  const resetStartSongPlaying = useResetRecoilState(StartSongPlayingAtom);
  const resetStopAndClear = useResetRecoilState(StopAndClearAtom);
  const resetDeletePlaylist = useResetRecoilState(DeletePlaylistAtom);

  const resetSongList = useResetRecoilState(SongListAtom);
  const resetActivePlaylist = useResetRecoilState(activePlaylistAtom);
  const resetNowPlaying = useResetRecoilState(NowPlayingAtom);
  const resetCurrentIndex = useResetRecoilState(CurrentIndexAtom);

  if (startSongPlaying >= 0) {
    setCurrentIndex(startSongPlaying);
    setTimeout(() => {
      const ae = GetAudioElem();
      if (ae) {
        ae.currentTime = 0;
        void ae.play();
      }
    }, 1);
    resetStartSongPlaying();
  }
  if (stopAndClear) {
    resetSongList();
    resetCurrentIndex();
    resetActivePlaylist();
    resetNowPlaying();
    resetStopAndClear();
  }
if (deletePlaylist !== '') {
  const delplaylist = ({ get, set }, newValue): void => {
    if (newValue instanceof DefaultValue) return;
    const playlists = get(PlaylistsAtom);
    playlists.delete(newValue);
    set(PlaylistsAtom, playlists);
    if (newValue === get(activePlaylistAtom)) {
      set(activePlaylistAtom, '');
    }
  };
  return <div style={{ visibility: 'hidden' }} />;
}

// This starts playing the song index from the songList
export const PlaySongNumberSel = selector<number>({
  key: 'PlaySongNum',
  get: () => -1,
  set: ({ get, set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      set(StopAndClearSel, true);
    } else {
      const songList = get(SongListAtom);
      if (newValue < 0 || newValue >= songList.length) {
        log(`PSNSel: bounds error: ${newValue} (of ${songList.length})`);
        return;
      }
      set(StartSongPlayingSel, newValue);
    }
  },
});

// Removes the given index from the current songList
// If it's active, move the current to the previous song
export const RemoveSongNumberSel = selector<number>({
  key: 'RemoveSongNumber',
  get: () => -1,
  set: ({ get, set }, index) => {
    if (index instanceof DefaultValue) return;
    const songList = get(SongListAtom);
    const curIndex = get(CurrentIndexAtom);
    songList.splice(index, 1);
    if (curIndex === index && index > 0) {
      set(PlaySongNumberSel, index - 1);
    } else if (curIndex > index) {
      set(CurrentIndexAtom, curIndex - 1);
    }
    set(SongListAtom, songList);
  },
});

// Adds a song to the end of the song list
const AddSongListSel = selector<SongKey[]>({
  key: 'AddSongList',
  get: () => [],
  set: ({ get, set }, keys) => {
    if (keys instanceof DefaultValue) return;
    const songList = get(SongListAtom);
    set(SongListAtom, songList.concat(keys));
    if (get(CurrentIndexAtom) < 0) {
      set(StartSongPlayingSel, 0);
    }
  },
});

// Add a specific song to the now playing set. Start it playing if
// nothing's already playing.
export const AddSongSel = selector<SongKey>({
  key: 'AddSong',
  get: () => '',
  set: ({ get, set }, key) => {
    if (key instanceof DefaultValue) return;
    set(AddSongListSel, [key]);
  },
});

export const AddAlbumSel = selector<AlbumKey>({
  key: 'AddAlbum',
  get: () => '',
  set: ({ get, set }, key) => {
    if (key instanceof DefaultValue) return;
    const album = get(AlbumByKey(key));
    set(AddSongListSel, album.songs);
  },
});

export const AddArtistSel = selector<ArtistKey>({
  key: 'AddArtist',
  get: () => '',
  set: ({ get, set }, key) => {
    if (key instanceof DefaultValue) return;
    const artist = get(ArtistByKey(key));
    set(AddSongListSel, artist.songs);
  },
});

/*
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
  StartSongPlaying(store, curIndex);
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
  StartSongPlaying(store, curIndex);
}
*/

export const StartPlaylistSel = selector<string>({
  key: 'StartPlaylist',
  get: () => '',
  set: ({ get, set }, name) => {
    if (name instanceof DefaultValue) return;
    const pl = get(PlaylistsAtom);
    const thePl = pl.get(name);
    if (!thePl) {
      log(`Invalid playlist name ${name}`);
      return;
    }
    set(activePlaylistAtom, name);
    set(SongListAtom, [...thePl]);
    set(StartSongPlayingSel, 0);
  },
});
