import { FontIcon, Slider, Stack } from '@fluentui/react';
import { useRecoilState } from 'recoil';
import { isHostMac } from '../MyWindow';
import { mutedState, volumeState } from '../Recoil/ReadWrite';
import { GetAudioElem } from './SongPlaying';
import './styles/VolumeControl.css';
import { mySliderStyles } from './Utilities';

export function VolumeControl(): JSX.Element {
  const [muted, setMuted] = useRecoilState(mutedState);
  const [volume, setVolume] = useRecoilState(volumeState);
  const ae = GetAudioElem();

  if (ae) {
    ae.muted = muted;
    ae.volume = volume * volume; // Better resolution at the lower volume
  }
  // Make the icon reflect approximate volume
  const iconNum = Math.min(3, Math.floor(4 * (volume + 0.1))).toString();
  const cls = `volume-container-${isHostMac() ? 'mac' : 'win-linux'}`;
  return (
    <Stack className={cls} id="volume-container" horizontal>
      <FontIcon
        id={muted ? 'mute' : 'volIcon'}
        iconName={muted ? 'VolumeDisabled' : `Volume${iconNum}`}
        onClick={() => setMuted(!muted)}
        style={{ cursor: 'pointer' }}
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
