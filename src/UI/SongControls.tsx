// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { GetAudioElem } from './SongPlayback';
import {
  playingAtom,
  songListAtom,
  repeatAtom,
  shuffleAtom,
} from '../Recoil/Local';
import {
  startNextSongAtom,
  startPrevSongAtom,
  shuffleNowPlayingAtom,
  startSongPlayingAtom,
} from '../Recoil/api';

import './styles/SongControls.css';

export default function SongControls(): JSX.Element {
  const [isPlaying, setIsPlaying] = useRecoilState(playingAtom);
  const [shuf, shufSet] = useRecoilState(shuffleAtom);
  const [rep, repSet] = useRecoilState(repeatAtom);
  const [, startSongPlaying] = useRecoilState(startSongPlayingAtom);
  const [, startNextSong] = useRecoilState(startNextSongAtom);
  const [, startPrevSong] = useRecoilState(startPrevSongAtom);
  const songList = useRecoilValue(songListAtom);
  const [, shuffleNowPlaying] = useRecoilState(shuffleNowPlayingAtom);

  const shufClass = shuf ? 'enabled' : 'disabled';
  const repClass = rep ? 'enabled' : 'disabled';
  return (
    <span className="control-container">
      <span
        id="shuffle"
        className={shufClass}
        onClick={() => {
          if (!shuf) {
            // If we're turning shuffle on, shuffle the Now Playing list
            shuffleNowPlaying(true);
          }
          shufSet(!shuf);
        }}
      >
        &nbsp;
      </span>
      <span id="prev" onClick={() => startPrevSong(true)}>
        &nbsp;
      </span>
      <span
        id="play-pause"
        className={isPlaying ? 'playing' : 'paused'}
        onClick={() => {
          const ae = GetAudioElem();
          if (!ae) {
            return;
          }
          if (isPlaying) {
            ae.pause();
            setIsPlaying(false);
          } else if (ae.readyState === 4) {
            ae.play()
              .then(() => setIsPlaying(true))
              .catch((e) => '');
          } else if (songList.length) {
            startSongPlaying(0);
          }
        }}
      />
      <span id="next" onClick={() => startNextSong(true)}>
        &nbsp;
      </span>
      <span id="repeat" className={repClass} onClick={() => repSet(!rep)}>
        &nbsp;
      </span>
      &nbsp;
    </span>
  );
}
