// @flow
// @format

import React, { useState } from 'react';
import Store from './MyStore';
import { GetDataForSong } from './DataAccess';

import type { Song } from './MyStore';

import './styles/SongPlayback.css';

const SongPlayback = () => {
  const [pos, setPos] = useState('songPos');
  if (window.positionInterval !== undefined) {
    window.clearInterval(window.positionInterval);
    delete window.positionInterval;
  }
  window.positionInterval = setInterval(() => {
    // Every .250 seconds, update the slider
    const ae = document.getElementById('audioElement');
    const rs = document.getElementById('song-slider');
    if (!ae || !rs) {
      return;
    }
    const val = Number.parseFloat(ae.currentTime / ae.duration);
    if (ae.duration >= 0 && ae.duration < Number.MAX_SAFE_INTEGER) {
      rs.value = val;
    }
  }, 250);

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
        onChange={(ev) => {
          setPos(ev.target.value);
          const ae = document.getElementById('audioElement');
          if (!ae) {
            return;
          }
          ae.currentTime = ae.duration * ev.target.value;
        }}
      />
      <span id="time-remaining">-</span>
      {audio}
    </span>
  );
};
export default SongPlayback;
