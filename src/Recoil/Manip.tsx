// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import {
  Resetter,
  useRecoilValue,
  useRecoilState,
  useResetRecoilState,
} from 'recoil';

import * as api from './api';
import {
  CurrentIndexAtom,
  MaybeAlbumByKey,
  MaybeArtistByKey,
  NowPlayingAtom,
  PlaylistsAtom,
  SongListAtom,
} from './MusicDbAtoms';
import { ActivePlaylistAtom, RepeatAtom, ShuffleAtom } from './Atoms';
import ShuffleArray from '../ShuffleArray';
import { GetAudioElem } from '../UI/SongPlayback';

import type { SongKey } from '../MyStore';

// TODO: Break this out into smaller chunks so that any random state change
// doesn't incur a full rerun of all this code...
export default function Manip(): JSX.Element {
  // "Functions"
  const startPlaylist = useRecoilValue(api.StartPlaylistAtom);
  const startNextSong = useRecoilState(api.StartNextSongAtom);
  const startPrevSong = useRecoilState(api.StartPrevSongAtom);
  const [constStartSongPlaying, setStartSongPlaying] = useRecoilState(
    api.StartSongPlayingAtom,
  );
  let startSongPlaying = constStartSongPlaying;
  const stopAndClear = useRecoilValue(api.StopAndClearAtom);
  const deletePlaylist = useRecoilValue(api.DeletePlaylistAtom);
  const removeSongNumber = useRecoilValue(api.RemoveSongNumberAtom);
  const addSongList = useRecoilValue(api.AddSongListAtom);
  const addSong = useRecoilValue(api.AddSongAtom);
  const addAlbum = useRecoilValue(api.AddAlbumAtom);
  const addArtist = useRecoilValue(api.AddArtistAtom);
  const shuffleNowPlaying = useRecoilValue(api.ShuffleNowPlayingAtom);

  // Resetters
  const resetStartPlaylist = useResetRecoilState(api.StartPlaylistAtom);
  const resetStartNextSong = useResetRecoilState(api.StartNextSongAtom);
  const resetStartPrevSong = useResetRecoilState(api.StartPrevSongAtom);
  const resetStartSongPlaying = useResetRecoilState(api.StartSongPlayingAtom);
  const resetStopAndClear = useResetRecoilState(api.StopAndClearAtom);
  const resetDeletePlaylist = useResetRecoilState(api.DeletePlaylistAtom);
  const resetRemoveSongNumber = useResetRecoilState(api.RemoveSongNumberAtom);
  const resetAddSongList = useResetRecoilState(api.AddSongListAtom);
  const resetAddSong = useResetRecoilState(api.AddSongAtom);
  const resetAddAlbum = useResetRecoilState(api.AddAlbumAtom);
  const resetAddArtist = useResetRecoilState(api.AddArtistAtom);
  const resetShuffleNowPlaying = useResetRecoilState(api.ShuffleNowPlayingAtom);

  // State input
  const [currentIndex, setCurrentIndex] = useRecoilState(CurrentIndexAtom);
  const [playlists, setPlaylists] = useRecoilState(PlaylistsAtom);
  const [activePlaylist, setActivePlaylist] = useRecoilState(
    ActivePlaylistAtom,
  );
  const [constSongList, setSongList] = useRecoilState(SongListAtom);
  let songList = constSongList;
  const repeat = useRecoilValue(RepeatAtom);
  const shuffle = useRecoilValue(ShuffleAtom);

  const resetSongList = useResetRecoilState(SongListAtom);
  const resetActivePlaylist = useResetRecoilState(ActivePlaylistAtom);
  const resetNowPlaying = useResetRecoilState(NowPlayingAtom);
  const resetCurrentIndex = useResetRecoilState(CurrentIndexAtom);

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

  const artistToAdd = useRecoilValue(MaybeArtistByKey(addArtist));
  const albumToAdd = useRecoilValue(MaybeAlbumByKey(addAlbum));
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
