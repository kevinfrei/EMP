// @flow
// @format

import React from 'react';
import Store from './MyStore';
import { StartNextSong, StartPrevSong } from './Playlist';

import './styles/SongControls.css';

const SongControls = () => {
  let store = Store.useStore();
  const playing = store.get('playing') ? 'playing' : 'paused';
  const shuf = store.get('shuffle');
  const rep = store.get('repeat');
  const shufSet = store.set('shuffle');
  const repSet = store.set('repeat');
  const shufClass = shuf ? 'enabled' : 'disabled';
  const repClass = rep ? 'enabled' : 'disabled';
  return (
    <span className="control-container">
      <span id="shuffle" className={shufClass} onClick={() => shufSet(!shuf)}>
        &nbsp;
      </span>
      <span id="prev" onClick={() => StartPrevSong(store)}>
        &nbsp;
      </span>
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
        }}
      ></span>
      <span id="next" onClick={() => StartNextSong(store)}>
        &nbsp;
      </span>
      <span id="repeat" className={repClass} onClick={() => repSet(!rep)}>
        &nbsp;
      </span>
      &nbsp;
    </span>
  );
};
export default SongControls;
