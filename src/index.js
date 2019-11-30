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
          name: 'Test Name',
          artist: 'Test Artist',
          album: 'Test Album',
          url: 'tune://song/song.flac',
        }
      ],
      "default_album_art": "pic://pic/img-pause.svg"
    });
  }
};

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
