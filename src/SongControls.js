// @flow
// @format

import React from 'react';
import Store from './MyStore';

import './styles/SongControls.css';

const SongControls = () => {
  let store = Store.useStore();
  const playing = store.get('playing') ? 'playing' : 'paused';
  return (
    <span className="control-container">
      <span id="shuffle"></span>
      <span id="prev">&nbsp;</span>
      <span
        id="play-pause"
        className={playing}
        onClick={() => {
          const ae = document.querySelector('#audioElement');
          if (playing === 'playing') {
            ae.pause();
          } else if (ae.readyState === 4) {
            ae.play();
          }
//          ae.ended bool
// ae volume: 1
// ae muted: bool
 // ae.currentTime
 // ae.duration
 // ae.readyState == 4 when it appears to be available to play or playing

        }}
      ></span>
      <span id="next">&nbsp;</span>
      <span id="repeat">&nbsp;</span>&nbsp;
    </span>
  );
};
export default SongControls;
