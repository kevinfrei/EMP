// @flow
// @format

import React from 'react';

import './styles/VolumeControl.css';

const VolumeControl = () => (
  <span id="volume-container">
    <span id="mute"></span>
    <input
      type="range"
      id="volume-slider"
      min={0}
      max={1}
      defaultValue={0.8}
      step={.01}
      onChange={(ev) => {
        const ae = document.querySelector('#audioElement');
        ae.volume = ev.target.valueAsNumber;
      }}
    />
  </span>
);

export default VolumeControl;
