import { MakeLogger } from '@freik/core-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  MaybePlayNextSong,
  MaybePlayPrevSong,
  ShuffleNowPlaying,
} from '../Recoil/api';
import {
  currentIndexAtom,
  hasNextSongSel,
  hasPrevSongSel,
  nowPlayingSortAtom,
  playingAtom,
  repeatAtom,
  shuffleAtom,
  songListAtom,
} from '../Recoil/Local';
import { GetAudioElem } from './SongPlayback';
import './styles/SongControls.css';

const log = MakeLogger('SongControls');

export default function SongControls(): JSX.Element {
  const [isPlaying, setIsPlaying] = useRecoilState(playingAtom);
  const [shuf, shufSet] = useRecoilState(shuffleAtom);
  const [rep, repSet] = useRecoilState(repeatAtom);
  const songListState = useRecoilState(songListAtom);
  const [songList] = songListState;
  const curIndexState = useRecoilState(currentIndexAtom);
  const [, setNowPlaylistSort] = useRecoilState(nowPlayingSortAtom);
  const hasNextSong = useRecoilValue(hasNextSongSel);
  const hasPrevSong = useRecoilValue(hasPrevSongSel);

  const shufClass = shuf ? 'enabled' : 'disabled';
  const repClass = rep ? 'enabled' : 'disabled';
  const playPauseClass = isPlaying
    ? 'playing'
    : songList.length > 0
    ? 'paused'
    : 'paused disabled';
  const nextClass = hasNextSong ? 'enabled' : 'disabled';
  const prevClass = hasPrevSong ? 'enabled' : 'disabled';

  const clickShuffle = () => {
    shufSet(!shuf);
    if (!shuf) {
      ShuffleNowPlaying(curIndexState, songListState, setNowPlaylistSort);
    }
  };
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
    } else {
      log(`We're not playing, but also not state 4: ${ae.readyState}`);
    }
  };
  const clickPrev = () => {
    if (hasPrevSong) {
      MaybePlayPrevSong(curIndexState, rep, songList.length);
    }
  };
  const clickNext = () => {
    if (hasNextSong) {
      MaybePlayNextSong(curIndexState, rep, shuf, songListState);
    }
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
