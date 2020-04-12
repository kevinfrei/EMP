// @flow
// @format

import React from 'react';
import Store from './MyStore';

import type { Song } from './MyStore';

import './styles/SongPlayback.css';

const SongPlayback = () => {
  let audio: React$Element<any>;
  let store = Store.useStore();
  const songKey = store.get('curSong');
  let title;
  let artist;
  if (songKey !== '') {
    audio = <audio autoPlay src={`tune://song/${songKey}`} />;
  } else {
    audio = <span />;
  }
  return (
    <span className="song-container">
      <span className="song-cover-art">
        <img id="current-cover-art" src="pic://pic/pic.svg" alt="album cover" />
      </span>
      <span id="song-name">Title</span>
      <span id="artist-name">Artist</span>
      <span id="now-playing-current-time"></span>
      <input type="range" id="song-slider" step=".1" />
      <span id="time-remaining">-</span>
      {audio}
    </span>
  );
};
export default SongPlayback;
