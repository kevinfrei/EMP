// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import Amplitude from 'amplitudejs';
import logger from 'simplelogger';
import { FTON } from 'my-utils';

import App from './App';
import * as serviceWorker from './serviceWorker';

import './styles/index.css';

const log = logger.bind('index');
logger.disable('index');

window.initApp = () => {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(<App />, root);
    Amplitude.init({
      songs: [],
      default_album_art: 'pic://pic/img-album.svg',
      debug: true
    });
  }
};

if (logger.isEnabled('index')) {
  // Don't bother with this if logging is disabled...
  let lastDisplayed = null;
  const logSong = () => {
    const activeSong = Amplitude.getActiveSongMetadata();
    if (activeSong) {
      const json = FTON.stringify(activeSong);
      if (lastDisplayed !== json) {
        log(activeSong);
        lastDisplayed = json;
      }
    }
  };
  window.setInterval(logSong, 5000);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
