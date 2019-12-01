// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import Amplitude from 'amplitudejs';

import App from './App';
import * as serviceWorker from './serviceWorker';

import './index.css';

window.initApp = () => {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(<App />, root);
    Amplitude.init({
      songs: [
        {
          name: 'Song 0',
          artist: 'Artist 0',
          album: 'Album 0',
          url: 'tune://song/0.flac',
          cover_art_url: 'pic://album/1.png'
        },
        {
          name: 'Song 1',
          artist: 'Artist 1',
          album: 'Album 1',
          url: 'tune://song/1.flac',
          cover_art_url: 'pic://album/1.png'
        },
        {
          name: 'Song 2',
          artist: 'Artist 2',
          album: 'Album 2',
          url: 'tune://song/2.flac',
          cover_art_url: 'pic://album/1.png'
        },
        {
          name: 'Song 3',
          artist: 'Artist 3',
          album: 'Album 3',
          url: 'tune://song/3.flac',
          cover_art_url: 'pic://album/1.png'
        }
      ],
      default_album_art: 'pic://pic/img-album.svg',
      debug: true
    });
  }
};

let lastDisplayed = null;
window.setInterval(() => {
  const activeSong = Amplitude.getActiveSongMetadata();
  const json = JSON.stringify(activeSong);
  if (lastDisplayed !== json) {
    console.log(activeSong);
    lastDisplayed = json;
  }
}, 5000);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
