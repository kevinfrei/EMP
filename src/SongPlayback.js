// @flow
// @format

import React from 'react';

import './styles/SongPlayback.css';

const SongPlayback = () => (
  <span className="song-container">
    <span className="song-cover-art">
      <img id="current-cover-art" src="pic://pic/pic.svg" alt="album cover" />
    </span>
    <span id="song-name">Title</span>
    <span id="artist-name">Artist</span>
    <span id="now-playing-current-time"></span>
    <input type="range" id="song-slider" step=".1" />
    <span id="time-remaining">-</span>
  </span>
);

export default SongPlayback;
