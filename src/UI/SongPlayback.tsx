// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect } from 'react';
import { Slider } from '@fluentui/react';
import { useRecoilState, useRecoilValue, SetterOrUpdater } from 'recoil';

import { startNextSongAtom } from '../Recoil/api';
import { ConfigurePositionInterval } from '../MyWindow';
import {
  mediaTimeAtom,
  mediaTimeRemainingSel,
  mediaTimePositionSel,
  mediaTimePercentRWSel,
  playingAtom,
} from '../Recoil/Atoms';
import {
  albumKeyForSongKeySel,
  currentSongKeySel,
  dataForSongSel,
  SongData,
} from '../Recoil/MusicDbAtoms';

import type { MediaTime } from '../Recoil/Atoms';

import './styles/SongPlayback.css';

export function GetAudioElem(): HTMLMediaElement | void {
  return document.getElementById('audioElement') as HTMLMediaElement;
}

let setTime: SetterOrUpdater<MediaTime> | null = null;

ConfigurePositionInterval(() => {
  // Every couple hundred milliseconds, update the slider
  if (!setTime) return;
  const ae = GetAudioElem();
  if (!ae || ae.duration <= 0) {
    return;
  }
  setTime({ position: ae.currentTime, duration: ae.duration });
}, 223); // Cuz prime numbers are fun

export default function SongPlayback(): JSX.Element {
  const [, setMediaTime] = useRecoilState(mediaTimeAtom);
  const [mediaTimePercent, setMediaTimePercent] = useRecoilState(
    mediaTimePercentRWSel,
  );
  const mediaTimePosition = useRecoilValue(mediaTimePositionSel);
  const mediaTimeRemaining = useRecoilValue(mediaTimeRemainingSel);

  let audio: React.ReactElement<HTMLAudioElement>;
  const songKey = useRecoilValue(currentSongKeySel);
  const [, startNextSong] = useRecoilState(startNextSongAtom);
  const [, setPlaying] = useRecoilState(playingAtom);
  const albumKey = useRecoilValue(albumKeyForSongKeySel(songKey));
  const { title, artist, album }: SongData = useRecoilValue(
    dataForSongSel(songKey),
  );
  let split = '';
  let picUrl = 'pic://pic/pic.svg';
  if (songKey !== '') {
    audio = (
      <audio
        id="audioElement"
        autoPlay
        src={'tune://song/' + songKey}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => startNextSong(true)}
      />
    ) as React.ReactElement<HTMLAudioElement>;
    picUrl = 'pic://album/' + albumKey;
    split = artist.length && album.length ? ': ' : '';
  } else {
    audio = <audio id="audioElement" />;
  }
  useEffect(() => {
    setTime = setMediaTime;
    return () => {
      setTime = null;
    };
  });
  return (
    <span id="song-container">
      <span id="song-cover-art">
        <img id="current-cover-art" src={picUrl} alt="album cover" />
      </span>
      <span id="song-name">{title}</span>
      <span id="artist-name">{`${artist}${split}${album}`}</span>
      <span id="now-playing-current-time">{mediaTimePosition}</span>
      <Slider
        className="song-slider"
        value={mediaTimePercent}
        min={0}
        max={1}
        step={1e-5}
        onChange={(value: number) => {
          const ae = GetAudioElem();
          if (!ae) {
            return;
          }
          const targetTime = ae.duration * value;
          // eslint-disable-next-line id-blacklist
          if (targetTime < Number.MAX_SAFE_INTEGER && targetTime >= 0) {
            ae.currentTime = ae.duration * value;
          }
          setMediaTimePercent(value);
        }}
        showValue={false}
      />
      <span id="now-playing-remaining-time">{mediaTimeRemaining}</span>
      {audio}
    </span>
  );
}
