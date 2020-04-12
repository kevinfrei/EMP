// @flow
// @format

import React from 'react';

import './styles/VolumeControl.css';

const VolumeControl = () => (
  <span id="volume-container">
    <span id="mute" onClick={(ev) => {
      const ae = document.getElementById('audioElement');
      ae.muted = !ae.muted;
    }}>&nbsp;</span>
    <input
      type="range"
      id="volume-slider"
      min={0}
      max={1}
      defaultValue={0.8}
      step={.01}
      onChange={(ev) => {
        const ae = document.getElementById('audioElement');
        ae.volume = ev.target.valueAsNumber;
        ae.muted = false;
      }}
    />
  </span>
);

export default VolumeControl;
