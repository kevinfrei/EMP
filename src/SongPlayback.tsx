import React, { useEffect } from 'react';
import { Slider } from '@fluentui/react';
import { useRecoilState, useRecoilValue, SetterOrUpdater } from 'recoil';

import Store from './MyStore';
import { GetDataForSong, GetAlbumKeyForSongKey } from './DataAccess';
import { StartNextSong } from './Playlist';
import { ConfigurePositionInterval } from './MyWindow';
import {
  mediaTimeAtom,
  mediaTimeRemainingSel,
  mediaTimePositionSel,
  mediaTimePercentRWSel,
} from './Recoil/Atoms';

import type { MediaTime } from './Recoil/Atoms';
import type { StoreState } from './MyStore';

import './styles/SongPlayback.css';

declare interface MyWindow extends Window {
  positionInterval?: number | NodeJS.Timeout;
}
declare let window: MyWindow;

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

export function StartSongPlaying(store: StoreState, index: number): void {
  const changing = store.get('curIndex') !== index;
  if (!changing) {
    return;
  }
  store.set('curIndex')(index);
  const ae = GetAudioElem();
  if (ae) {
    setTimeout(() => {
      ae.currentTime = 0;
      void ae.play();
    }, 1);
  }
}

export function StopSongPlaying(store: StoreState): void {
  store.set('playing')(false);
}

export default function SongPlayback(): JSX.Element {
  const [, setMediaTime] = useRecoilState(mediaTimeAtom);
  const [mediaTimePercent, setMediaTimePercent] = useRecoilState(
    mediaTimePercentRWSel,
  );
  const mediaTimePosition = useRecoilValue(mediaTimePositionSel);
  const mediaTimeRemaining = useRecoilValue(mediaTimeRemainingSel);

  let audio: React.ReactElement<HTMLAudioElement>;
  const store = Store.useStore();
  const curIndex = store.get('curIndex');
  const songIndex = store.get('songList');
  const songKey = curIndex >= 0 ? songIndex[curIndex] : '';
  const playing = store.set('playing');
  let title = '';
  let artist = '';
  let album = '';
  let split = '';
  let picUrl = 'pic://pic/pic.svg';
  if (songKey !== '') {
    audio = (
      <audio
        id="audioElement"
        autoPlay
        src={'tune://song/' + songKey}
        onPlay={() => playing(true)}
        onPause={() => playing(false)}
        onEnded={() => StartNextSong(store)}
      />
    ) as React.ReactElement<HTMLAudioElement>;
    picUrl = 'pic://album/' + GetAlbumKeyForSongKey(store, songKey);
    ({ title, artist, album } = GetDataForSong(store, songKey));
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
