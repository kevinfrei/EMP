import { IconButton, Slider, Stack } from '@fluentui/react';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState } from 'recoil';
import { mutedAtom, volumeAtom } from '../Recoil/ReadWrite';
import { GetAudioElem } from './SongPlayback';
import './styles/VolumeControl.css';
import { mySliderStyles } from './Utilities';

export default function VolumeControl(): JSX.Element {
  const [muted, setMuted] = useRecoilState(mutedAtom);
  const [volume, setVolume] = useRecoilState(volumeAtom);

  const ae = GetAudioElem();

  if (ae) {
    ae.muted = muted;
    ae.volume = volume * volume; // Better resolution at the lower volume
  }
  // Make the icon reflect approximate volume
  const iconNum = Math.min(3, Math.floor(4 * (volume + 0.1))).toString();
  return (
    <Stack id="volume-container" horizontal>
      <IconButton
        className={muted ? 'mute' : 'volIcon'}
        iconProps={{ iconName: muted ? 'VolumeDisabled' : `Volume${iconNum}` }}
        onClick={() => setMuted(!muted)}
        allowDisabledFocus={false}
      />
      <Slider
        className="volume-slider"
        styles={mySliderStyles}
        min={0}
        max={1}
        value={volume}
        step={0.01}
        showValue={false}
        onChange={(value: number) => {
          setVolume(value);
          if (muted) setMuted(false);
        }}
      />
    </Stack>
  );
}
