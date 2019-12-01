// @flow
// @format

import React from 'react';

import './SongPlayback.css';

const SongPlayback = () => (
  <span className="song-container">
    <span className="song-cover-art">
      <img
        id="current-cover-art"
        amplitude-song-info="cover_art_url"
        amplitude-main-song-info="true"
        src="pic://pic/pic.svg"
        alt="album cover"
      />
    </span>
    <span
      amplitude-song-info="name"
      amplitude-main-song-info="true"
      className="song-name"
    >
      Title
    </span>
    <span
      amplitude-song-info="artist"
      amplitude-main-song-info="true"
      className="artist-name"
    >
      Artist
    </span>
    <span
      id="now-playing-current-time"
      className="amplitude-current-time"
    ></span>
    <input type="range" className="amplitude-song-slider" step=".1" />
    <span id="now-playing-remaining-time">
      -<span className="amplitude-time-remaining"></span>
    </span>
  </span>
);

export default SongPlayback;
