// @flow
// @format

import React from 'react';

import './styles/VolumeControl.css';

const VolumeControl = () => (
  <span className="volume-container">
    <span className="amplitude-mute"></span>
    <input type="range" className="amplitude-volume-slider" />
  </span>
);

export default VolumeControl;