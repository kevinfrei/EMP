import { FontIcon, Slider } from '@fluentui/react';
import { useRecoilState } from 'recoil';
import { isHostMac } from '../MyWindow';
import { mutedState, volumeState } from '../Recoil/ReadWrite';
import { mySliderStyles } from './Utilities';
import './styles/VolumeControl.css';

export function VolumeControl(): JSX.Element {
  const [muted, setMuted] = useRecoilState(mutedState);
  const [volume, setVolume] = useRecoilState(volumeState);
  // Make the icon reflect approximate volume
  const iconNum = Math.min(3, Math.floor(4 * (volume + 0.1))).toString();
  const cls = `volume-container-${isHostMac() ? 'mac' : 'win-linux'}`;
  return (
    <span className={cls} id="volume-container">
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
    </span>
  );
}
