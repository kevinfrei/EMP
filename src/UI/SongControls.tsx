// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Logger } from '@freik/core-utils';

import { GetAudioElem } from './SongPlayback';
import {
  playingAtom,
  songListAtom,
  repeatAtom,
  shuffleAtom,
  currentIndexAtom,
  hasNextSongSel,
  hasPrevSongSel,
} from '../Recoil/Local';
import {
  startPrevSongAtom,
  startSongPlayingAtom,
} from '../Recoil/api';

import './styles/SongControls.css';
import { MaybePlayNextSong } from '../Recoil/Manip';

const log = Logger.bind('SongControls');
Logger.enable('SongControls');

export default function SongControls(): JSX.Element {
  const [isPlaying, setIsPlaying] = useRecoilState(playingAtom);
  const [shuf, shufSet] = useRecoilState(shuffleAtom);
  const [rep, repSet] = useRecoilState(repeatAtom);
  /*
  const [, startSongPlaying] = useRecoilState(startSongPlayingAtom);
  const [, startPrevSong] = useRecoilState(startPrevSongAtom);
  */
  const hasNextSong = useRecoilValue(hasNextSongSel);
  const hasPrevSong = useRecoilValue(hasPrevSongSel);
  const [songList, setSongList] = useRecoilState(songListAtom);
  const [curIndex, setCurIndex] = useRecoilState(currentIndexAtom);
  const [, setPlaying] = useRecoilState(playingAtom);

  const shufClass = shuf ? 'enabled' : 'disabled';
  const repClass = rep ? 'enabled' : 'disabled';
  const playPauseClass = isPlaying
    ? 'playing'
    : songList.length > 0
    ? 'paused'
    : 'paused disabled';
  const nextClass = hasNextSong ? 'enabled' : 'disabled';
  const prevClass = hasNextSong ? 'enabled' : 'disabled';
  // TODO: Change the current song list when this is changed
  const clickShuffle = () => shufSet(!shuf);
  const clickRepeat = () => repSet(!rep);
  const clickPlayPause = () => {
    const ae = GetAudioElem();
    if (!ae) {
      log('Clicking but no audio element');
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
      log('Should start a song playing, apparently');
      //      startSongPlaying(0);
    }
  };
  const clickPrev = () => {
    if (hasPrevSong) {
      log('prev track');
    }
  };
  const clickNext = () => {
    MaybePlayNextSong(
      curIndex,
      setCurIndex,
      rep,
      shuf,
      songList,
      setSongList,
      setPlaying,
    );
  };
  return (
    <span className="control-container">
      <span id="shuffle" className={shufClass} onClick={clickShuffle}>
        &nbsp;
      </span>
      <span id="prev" className={prevClass} onClick={clickPrev}>
        &nbsp;
      </span>
      <span id="play-pause" className={playPauseClass} onClick={clickPlayPause}>
        &nbsp;
      </span>
      <span id="next" className={nextClass} onClick={clickNext}>
        &nbsp;
      </span>
      <span id="repeat" className={repClass} onClick={clickRepeat}>
        &nbsp;
      </span>
      &nbsp;
    </span>
  );
}
