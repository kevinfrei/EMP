// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import {
  atom,
  selector,
  DefaultValue,
  useRecoilValue,
  useRecoilState,
  useResetRecoilState,
} from 'recoil';
import { GetAudioElem } from '../UI/SongPlayback';
import { Logger } from '@freik/core-utils';

import * as api from './api';
import {
  AlbumByKey,
  ArtistByKey,
  CurrentIndexAtom,
  MaybeAlbumByKey,
  MaybeArtistByKey,
  NowPlayingAtom,
  PlaylistsAtom,
  SongListAtom,
} from './MusicDbAtoms';
import { activePlaylistAtom } from './Atoms';

import type { SongKey, AlbumKey, ArtistKey } from '../MyStore';

const log = Logger.bind('Manip.tsx');
Logger.disable('Manip.tsx');

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

// True if we're playing from a playlist and not a random song list
export function PlayingPlaylist(playlistName: string): boolean {
  return playlistName.length > 0;
}

export function Manip(): JSX.Element {
  // "Functions"
  const [startSongPlaying, setStartSongPlaying] = useRecoilValue(
    api.StartSongPlayingAtom,
  );
  const stopAndClear = useRecoilValue(api.StopAndClearAtom);
  const deletePlaylist = useRecoilValue(api.DeletePlaylistAtom);
  const removeSongNumber = useRecoilValue(api.RemoveSongNumberAtom);
  const addSongList = useRecoilValue(api.AddSongListAtom);
  const addSong = useRecoilValue(api.AddSongAtom);
  const addAlbum = useRecoilValue(api.AddAlbumAtom);
  const addArtist = useRecoilValue(api.AddArtistAtom);

  // Resetters
  const resetStartSongPlaying = useResetRecoilState(api.StartSongPlayingAtom);
  const resetStopAndClear = useResetRecoilState(api.StopAndClearAtom);
  const resetDeletePlaylist = useResetRecoilState(api.DeletePlaylistAtom);
  const resetRemoveSongNumber = useResetRecoilState(api.RemoveSongNumberAtom);
  const resetAddSongList = useResetRecoilState(api.AddSongListAtom);
  const resetAddSong = useResetRecoilState(api.AddSongAtom);
  const resetAddAlbum = useResetRecoilState(api.AddAlbumAtom);
  const resetAddArtist = useResetRecoilState(api.AddArtistAtom);

  // State input
  const [currentIndex, setCurrentIndex] = useRecoilState(CurrentIndexAtom);
  const [playlists, setPlaylists] = useRecoilState(PlaylistsAtom);
  const activePlaylist = useRecoilValue(ActivePlaylistAtom);
  const [songList, setSongList] = useRecoilState(SongListAtom);

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
    playlists.delete(deletePlaylist);
    setPlaylists(playlists);
    if (deletePlaylist === activePlaylist) {
      resetActivePlaylist();
    }
    resetDeletePlaylist();
  }
  // Removes the given index from the current songList
  // If it's active, move the current to the previous song
  if (removeSongNumber >= 0) {
    songList.splice(removeSongNumber, 1);
    if (currentIndex === removeSongNumber && removeSongNumber > 0) {
      setStartSongPlaying(removeSongNumber - 1);
    } else if (currentIndex > removeSongNumber) {
      setCurrentIndex(currentIndex - 1);
    }
    setSongList(songList);
    resetRemoveSongNumber();
  }

  const artistToAdd = useRecoilValue(MaybeArtistByKey(addArtist));
  const albumToAdd = useRecoilValue(MaybeAlbumByKey(addArtist));
  const artistList = artistToAdd === null ? [] : artistToAdd.songs;
  const albumList = albumToAdd === null ? [] : albumToAdd.songs;
  // Adds a song to the end of the song list
  for (const [list, reset] of [
    [addSongList, resetAddSong],
    [albumList, resetAddAlbum],
    [artistList, resetAddArtist],
  ]) {
    if (list.length > 0) {
      setSongList(songList.concat(list));
      if (currentIndex < 0) {
        setStartSongPlaying(0);
      }
      reset();
    }
  }
  // Add a specific song to the now playing set. Start it playing if
  // nothing's already playing.
  if (addSong.length > 0) {
    songList.push(addSong);
    setSongList(songList);
    if (currentIndex < 0) {
      setStartSongPlaying(0);
    }
    resetAddSong();
  }

  return <div style={{ visibility: 'hidden' }} />;
}
