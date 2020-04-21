// @flow
// @format

import React, { useState } from 'react';

import './styles/VolumeControl.css';

// Volume holds no "React State"
// I could wire it up
// (and will need to if I want to save the values between runs)
export default function VolumeControl() {
  let ae = document.getElementById('audioElement');
  const initM = !!ae && ae.muted;
  const [muted, setMuted] = useState(initM);
  if (ae) {
    ae.muted = muted;
  }
  return (
    <span id="volume-container">
      <span
        id="mute"
        className={muted ? 'muted' : 'not-muted'}
        onClick={(ev) => setMuted(!muted)}
      >
        &nbsp;
      </span>
      <input
        type="range"
        id="volume-slider"
        min={0}
        max={1}
        defaultValue={0.8}
        step={0.01}
        onChange={(ev) => {
          ae = document.getElementById('audioElement');
          if (!ae) return;
          ae.volume = ev.target.valueAsNumber;
          if (muted) {
            setMuted(false);
          }
        }}
      />
    </span>
  );
}
