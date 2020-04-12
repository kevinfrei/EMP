// @flow
// @format

import React from 'react';

import './styles/VolumeControl.css';

const VolumeControl = () => (
  <span id="volume-container">
    <span id="mute"></span>
    <input type="range" id="volume-slider" />
  </span>
);

export default VolumeControl;