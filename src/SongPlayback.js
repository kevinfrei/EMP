// @flow
// @format

import React from 'react';
import Store, { GetDataForSong } from './MyStore';

import type { Song } from './MyStore';

import './styles/SongPlayback.css';

const SongPlayback = () => {
  let audio: React$Element<any>;
  let store = Store.useStore();
  const songKey = store.get('curSong');
  const playing = store.set('playing');
  let title = '-';
  let artist = '-';
  if (songKey !== '') {
    audio = (
      <audio
        id="audioElement"
        autoPlay
        src={`tune://song/${songKey}`}
        onPlay={() => playing(true)}
        onPause={() => playing(false)}
      />
    );
    ({ title, artist } = GetDataForSong(store, songKey));
  } else {
    audio = <audio id="audioElement" />;
  }
  return (
    <span className="song-container">
      <span className="song-cover-art">
        <img id="current-cover-art" src="pic://pic/pic.svg" alt="album cover" />
      </span>
      <span id="song-name">{title}</span>
      <span id="artist-name">{artist}</span>
      <span id="now-playing-current-time"></span>
      <input
        type="range"
        id="song-slider"
        min="0"
        max="1"
        step="1e-6"
        onInput={(ev) => {
          const ae = document.querySelector('#audioElement');
          ae.currentTime = ae.duration * ev.target.value;
        }}
      />
      <span id="time-remaining">-</span>
      {audio}
    </span>
  );
};
export default SongPlayback;
