// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { useRecoilValue, useRecoilState, useResetRecoilState } from 'recoil';

import * as api from './api';
import { currentIndexAtom, playlistsAtom, songListAtom } from './Local';

import { activePlaylistAtom } from './Local';

// TODO: Break this out into smaller chunks so that any random state change
// doesn't incur a full rerun of all this code...

// TODO: I dislike almost everything about this. I need a better solution :/
export default function ApiManipulation(): JSX.Element {
  // "Functions"
  const startPlaylist = useRecoilValue(api.startPlaylistAtom);
  const deletePlaylist = useRecoilValue(api.deletePlaylistAtom);

  // Resetters
  const resetStartPlaylist = useResetRecoilState(api.startPlaylistAtom);
  const resetDeletePlaylist = useResetRecoilState(api.deletePlaylistAtom);

  // State input
  const [, setCurrentIndex] = useRecoilState(currentIndexAtom);
  const [playlists, setPlaylists] = useRecoilState(playlistsAtom);
  const [activePlaylist, setActivePlaylist] = useRecoilState(
    activePlaylistAtom,
  );
  const [, setSongList] = useRecoilState(songListAtom);

  const resetActivePlaylist = useResetRecoilState(activePlaylistAtom);

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

  return <div style={{ display: 'none' }} />;
}
