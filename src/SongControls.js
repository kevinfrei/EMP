// @flow
// @format

import React from 'react';

import './SongControls.css';

const SongControls = () => (
  <span className="control-container">
    <span className="amplitude-shuffle"></span>
    <span className="amplitude-prev"></span>
    <span
      className="amplitude-play-pause"
      amplitude-main-play-pause="true"
      id="play-pause"
    ></span>{' '}
    <span className="amplitude-next">&nbsp;</span>
    <span className="amplitude-repeat">&nbsp;</span>&nbsp;
  </span>
);

export default SongControls;
