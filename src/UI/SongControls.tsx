// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { GetAudioElem } from './SongPlayback';
import { PlayingAtom, RepeatAtom, ShuffleAtom } from '../Recoil/Atoms';
import { SongListAtom } from '../Recoil/MusicDbAtoms';
import {
  StartNextSongAtom,
  StartPrevSongAtom,
  ShuffleNowPlayingAtom,
  StartSongPlayingAtom,
} from '../Recoil/api';

import './styles/SongControls.css';

export default function SongControls(): JSX.Element {
  const playing = useRecoilValue(PlayingAtom) ? 'playing' : 'paused';
  const [shuf, shufSet] = useRecoilState(ShuffleAtom);
  const [rep, repSet] = useRecoilState(RepeatAtom);
  const [, StartSongPlaying] = useRecoilState(StartSongPlayingAtom);
  const [, StartNextSong] = useRecoilState(StartNextSongAtom);
  const [, StartPrevSong] = useRecoilState(StartPrevSongAtom);
  const songList = useRecoilValue(SongListAtom);
  const [, ShuffleNowPlaying] = useRecoilState(ShuffleNowPlayingAtom);

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
            ShuffleNowPlaying(true);
          }
          shufSet(!shuf);
        }}
      >
        &nbsp;
      </span>
      <span id="prev" onClick={() => StartPrevSong(true)}>
        &nbsp;
      </span>
      <span
        id="play-pause"
        className={playing}
        onClick={() => {
          const ae = GetAudioElem();
          if (!ae) {
            return;
          }
          if (playing === 'playing') {
            ae.pause();
          } else if (ae.readyState === 4) {
            void ae.play();
          } else if (songList.length) {
            StartSongPlaying(0);
          }
        }}
      ></span>
      <span id="next" onClick={() => StartNextSong(true)}>
        &nbsp;
      </span>
      <span id="repeat" className={repClass} onClick={() => repSet(!rep)}>
        &nbsp;
      </span>
      &nbsp;
    </span>
  );
}
