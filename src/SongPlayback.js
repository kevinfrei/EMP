// @flow
// @format

import React, { useState } from 'react';
import Store from './MyStore';
import { GetDataForSong, GetAlbumKeyForSongKey } from './DataAccess';
import { StartNextSong } from './Playlist';

import type { StoreState } from './MyStore';

import './styles/SongPlayback.css';

const secondsToTime = (val: number): string => {
  const expr = new Date(val * 1000).toISOString();
  if (val < 600) {
    return expr.substr(15, 4);
  } else if (val < 3600) {
    return expr.substr(14, 5);
  } else if (val < 36000) {
    return expr.substr(12, 7);
  } else {
    return expr.substr(11, 8);
  }
};

if (window.positionInterval !== undefined) {
  window.clearInterval(window.positionInterval);
  delete window.positionInterval;
}
window.positionInterval = setInterval(() => {
  // Every .250 seconds, update the slider
  const ae = document.getElementById('audioElement');
  const rs = document.getElementById('song-slider');
  if (!ae) {
    return;
  }
  if (ae.duration >= 0 && ae.duration < Number.MAX_SAFE_INTEGER) {
    if (rs) {
      const val = Number.parseFloat(ae.currentTime / ae.duration);
      rs.value = val;
    }
    const npct = document.getElementById('now-playing-current-time');
    const nprt = document.getElementById('now-playing-remaining-time');
    if (npct) {
      npct.innerText = secondsToTime(ae.currentTime);
    }
    if (nprt) {
      nprt.innerText = '-' + secondsToTime(ae.duration - ae.currentTime);
    }
  }
}, 250);

export function StartSongPlaying(store: StoreState, index: number) {
  const changing = store.get('curIndex') !== index;
  if (!changing) {
    return;
  }
  store.set('curIndex')(index);
  const ae = document.getElementById('audioElement');
  if (ae) {
    setTimeout(() => {
      ae.currentTime = 0;
      ae.play();
    }, 1);
  } else {
    console.log('unable to find audioElement!');
  }
}

export function StopSongPlaying(store: StoreState) {
  store.set('playing')(false);
  const ae = document.getElementById('audioElement');
  if (ae) {
    console.log('Cleaning up Audio element status');
    ae.src = '';
    ae.currentTime = 0;
    const npct = document.getElementById('now-playing-current-time');
    const nprt = document.getElementById('now-playing-remaining-time');
    npct.innerText = '';
    nprt.innerText = '';
    const rs = document.getElementById('song-slider');
    rs.value = 0;
  }
}

export default function SongPlayback() {
  const [, setPos] = useState('songPos');

  let audio: React$Element<any>;
  let store = Store.useStore();
  const curIndex = store.get('curIndex');
  const songIndex = store.get('songList');
  const songKey = curIndex >= 0 ? songIndex[curIndex] : '';
  const playing = store.set('playing');
  let title = '';
  let artist = '';
  let album = '';
  let split = '';
  let picUrl = 'pic://pic/pic.svg';
  if (songKey !== '') {
    audio = (
      <audio
        id="audioElement"
        autoPlay
        src={'tune://song/' + songKey}
        onPlay={() => playing(true)}
        onPause={() => playing(false)}
        onEnded={() => StartNextSong(store)}
      />
    );
    picUrl = 'pic://album/' + GetAlbumKeyForSongKey(store, songKey);
    ({ title, artist, album } = GetDataForSong(store, songKey));
    split = artist.length && album.length ? ': ' : '';
  } else {
    audio = <audio id="audioElement" />;
  }
  return (
    <span id="song-container">
      <span id="song-cover-art">
        <img id="current-cover-art" src={picUrl} alt="album cover" />
      </span>
      <span id="song-name">{title}</span>
      <span id="artist-name">{`${artist}${split}${album}`}</span>
      <span id="now-playing-current-time"></span>
      <input
        type="range"
        id="song-slider"
        min="0"
        max="1"
        step="1e-5"
        onChange={(ev) => {
          setPos(ev.target.value);
          const ae = document.getElementById('audioElement');
          if (!ae) {
            return;
          }
          const targetTime = ae.duration * ev.target.value;
          if (targetTime < Number.MAX_SAFE_INTEGER && targetTime >= 0) {
            ae.currentTime = ae.duration * ev.target.value;
          }
        }}
      />
      <span id="now-playing-remaining-time"></span>
      {audio}
    </span>
  );
}
