// @flow
// @format

import React from 'react';

import './styles/SongControls.css';

const SongControls = () => (
  <span className="control-container">
    <span id="shuffle"></span>
    <span id="prev"></span>
    <span id="play-pause" className="paused"></span>
    <span id="next">&nbsp;</span>
    <span id="repeat">&nbsp;</span>&nbsp;
  </span>
);

export default SongControls;
