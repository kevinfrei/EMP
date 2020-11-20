import { IconButton, Slider, Stack } from '@fluentui/react';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState } from 'recoil';
import { mutedAtom, volumeAtom } from '../Recoil/ReadWrite';
import { GetAudioElem } from './SongPlayback';
import './styles/VolumeControl.css';

export default function VolumeControl(): JSX.Element {
  const [muted, setMuted] = useRecoilState(mutedAtom);
  const [volume, setVolume] = useRecoilState(volumeAtom);

  const ae = GetAudioElem();

  if (ae) {
    ae.muted = muted;
    ae.volume = volume * volume; // Better resolution at the lower volume
  }
  return (
    <Stack id="volume-container" horizontal>
      <IconButton
        className="mute"
        iconProps={{ iconName: muted ? 'Volume0' : 'Volume3' }}
        onClick={() => setMuted(!muted)}
        allowDisabledFocus={false}
      />
      <Slider
        className="volume-slider"
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
