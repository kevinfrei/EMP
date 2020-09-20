// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import {
  Resetter,
  useRecoilValue,
  useRecoilState,
  useResetRecoilState,
} from 'recoil';

import * as api from './api';
import { maybeAlbumByKeySel, maybeArtistByKeySel } from './ReadOnly';
import {
  currentIndexAtom,
  nowPlayingAtom,
  playlistsAtom,
  songListAtom,
} from './Local';

import { activePlaylistAtom, repeatAtom, shuffleAtom } from './Local';
import ShuffleArray from '../ShuffleArray';
import { GetAudioElem } from '../UI/SongPlayback';

import type { SongKey } from '../DataSchema';

// TODO: Break this out into smaller chunks so that any random state change
// doesn't incur a full rerun of all this code...

// TODO: I dislike almost everything about this. I need a better solution :/
export default function ApiManipulation(): JSX.Element {
  // "Functions"
  const startPlaylist = useRecoilValue(api.startPlaylistAtom);
  const startNextSong = useRecoilState(api.startNextSongAtom);
  const startPrevSong = useRecoilState(api.startPrevSongAtom);
  const [constStartSongPlaying, setStartSongPlaying] = useRecoilState(
    api.startSongPlayingAtom,
  );
  let startSongPlaying: number = constStartSongPlaying;
  const stopAndClear = useRecoilValue(api.stopAndClearAtom);
  const deletePlaylist = useRecoilValue(api.deletePlaylistAtom);
  const removeSongNumber = useRecoilValue(api.removeSongNumberAtom);
  const addSongList = useRecoilValue(api.addSongListAtom);
  const addSong = useRecoilValue(api.addSongAtom);
  const addAlbum = useRecoilValue(api.addAlbumAtom);
  const addArtist = useRecoilValue(api.addArtistAtom);
  const shuffleNowPlaying = useRecoilValue(api.shuffleNowPlayingAtom);

  // Resetters
  const resetStartPlaylist = useResetRecoilState(api.startPlaylistAtom);
  const resetStartNextSong = useResetRecoilState(api.startNextSongAtom);
  const resetStartPrevSong = useResetRecoilState(api.startPrevSongAtom);
  const resetStartSongPlaying = useResetRecoilState(api.startSongPlayingAtom);
  const resetStopAndClear = useResetRecoilState(api.stopAndClearAtom);
  const resetDeletePlaylist = useResetRecoilState(api.deletePlaylistAtom);
  const resetRemoveSongNumber = useResetRecoilState(api.removeSongNumberAtom);
  const resetAddSongList = useResetRecoilState(api.addSongListAtom);
  const resetAddSong = useResetRecoilState(api.addSongAtom);
  const resetAddAlbum = useResetRecoilState(api.addAlbumAtom);
  const resetAddArtist = useResetRecoilState(api.addArtistAtom);
  const resetShuffleNowPlaying = useResetRecoilState(api.shuffleNowPlayingAtom);

  // State input
  const [currentIndex, setCurrentIndex] = useRecoilState(currentIndexAtom);
  const [playlists, setPlaylists] = useRecoilState(playlistsAtom);
  const [activePlaylist, setActivePlaylist] = useRecoilState(
    activePlaylistAtom,
  );
  const [constSongList, setSongList] = useRecoilState(songListAtom);
  let songList = constSongList;
  const repeat = useRecoilValue(repeatAtom);
  const shuffle = useRecoilValue(shuffleAtom);

  const resetSongList = useResetRecoilState(songListAtom);
  const resetActivePlaylist = useResetRecoilState(activePlaylistAtom);
  const resetNowPlaying = useResetRecoilState(nowPlayingAtom);
  const resetCurrentIndex = useResetRecoilState(currentIndexAtom);

  // Start playing a particular playlist
  if (startPlaylist.length > 0) {
    const pl = playlists.get(startPlaylist);
    if (pl) {
      setActivePlaylist(startPlaylist);
      setSongList([...pl]);
      // TODO: Check for shuffle play and start by shuffling!
      startSongPlaying = 0;
    }
    resetStartPlaylist();
  }

  // Moves the current playset forward
  // Should handle repeat & shuffle as well
  if (startNextSong && currentIndex >= 0) {
    // Scooch to the next song
    startSongPlaying = currentIndex + 1;
    if (startSongPlaying >= songList.length) {
      // If we've past the end of the list, check to see if we're repeating
      if (!repeat) {
        startSongPlaying = -1;
        resetCurrentIndex();
      } else {
        startSongPlaying = 0;
        if (shuffle) {
          songList = ShuffleArray(songList);
          setSongList(songList);
        }
      }
    }
    resetStartNextSong();
  }
  // Moves the current playset backward
  if (startPrevSong && currentIndex >= 0) {
    startSongPlaying = currentIndex - 1;
    if (startSongPlaying < 0) {
      // If we've past the end of the list, check to see if we're repeating
      if (repeat) {
        startSongPlaying = songList.length - 1;
      } else {
        resetCurrentIndex();
      }
    }
    resetStartPrevSong();
  }

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

  const artistToAdd = useRecoilValue(maybeArtistByKeySel(addArtist));
  const albumToAdd = useRecoilValue(maybeAlbumByKeySel(addAlbum));
  const artistList: SongKey[] = artistToAdd === null ? [] : artistToAdd.songs;
  const albumList: SongKey[] = albumToAdd === null ? [] : albumToAdd.songs;
  const justASong: SongKey[] = addSong.length > 0 ? [addSong] : [];
  // Adds a list of songs to the end of the current song list
  for (const [list, reset] of [
    [addSongList, resetAddSongList],
    [albumList, resetAddAlbum],
    [artistList, resetAddArtist],
    [justASong, resetAddSong],
  ]) {
    if (list.length > 0) {
      setSongList(songList.concat(list as SongKey[]));
      if (currentIndex < 0) {
        setStartSongPlaying(0);
      }
      (reset as Resetter)();
    }
  }

  // This shuffles now playing without changing what's currently playing
  // If something is playing, it's the first song in the shuffled playlist
  if (shuffleNowPlaying) {
    if (currentIndex < 0) {
      songList = ShuffleArray(songList);
    } else {
      // if we're currently playing something, remove it from the array
      const curKey = songList[currentIndex];
      songList.splice(currentIndex, 1);
      // Now put it at the top of the list
      songList = [curKey, ...ShuffleArray(songList)];
      setCurrentIndex(0);
    }
    setSongList(songList);
    resetShuffleNowPlaying();
  }
  return <div style={{ display: 'none' }} />;
}
