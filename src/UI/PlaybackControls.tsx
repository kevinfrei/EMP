import {
  MyTransactionInterface,
  onRejected,
  useMyTransaction,
} from '@freik/web-utils';
import debug from 'debug';
import { ForwardedRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Keys } from 'shared';
import { playingState } from '../Recoil/MediaPlaying';
import { repeatState, shuffleFunc } from '../Recoil/ReadWrite';
import {
  hasAnySongsFunc,
  hasNextSongFunc,
  hasPrevSongFunc,
} from '../Recoil/SongPlaying';
import { MaybePlayNext, MaybePlayPrev } from '../Recoil/api';
import { isMutableRefObject } from '../Tools';
import { GetHelperText } from './Utilities';
import './styles/PlaybackControls.css';

const log = debug('EMP:render:SongControls:log');
const err = debug('EMP:render:SongControls:error');

export function onClickPlayPause(
  { set }: MyTransactionInterface,
  audioRef: ForwardedRef<HTMLAudioElement>,
): void {
  if (!isMutableRefObject<HTMLAudioElement>(audioRef)) {
    err('Clicking but no audio element');
    return;
  }
  set(playingState, (isPlaying) => {
    if (isPlaying) {
      audioRef.current.pause();
      return false;
    } else if (audioRef.current.readyState === 4) {
      audioRef.current.play().catch(onRejected('Audio Element play failed'));
      return true;
    } else {
      log(
        `We're not playing, but also not state 4: ${audioRef.current.readyState}`,
      );
    }
    return isPlaying;
  });
}

export type PlaybackControlsProps = {
  audioRef: ForwardedRef<HTMLAudioElement>;
};

export function PlaybackControls({
  audioRef,
}: PlaybackControlsProps): JSX.Element {
  const isPlaying = useRecoilValue(playingState);

  const hasAnySong = useRecoilValue(hasAnySongsFunc);
  const shuf = useRecoilValue(shuffleFunc);
  const [rep, repSet] = useRecoilState(repeatState);
  const hasNextSong = useRecoilValue(hasNextSongFunc);
  const hasPrevSong = useRecoilValue(hasPrevSongFunc);

  const shufClass = shuf ? 'enabled' : 'disabled';
  const repClass = rep ? 'enabled' : 'disabled';
  const playPauseClass = isPlaying
    ? 'playing'
    : hasAnySong
    ? 'paused'
    : 'paused disabled';
  const nextClass = hasNextSong ? 'enabled' : 'disabled';
  const prevClass = hasPrevSong ? 'enabled' : 'disabled';

  const clickShuffle = useMyTransaction((xact) => () => {
    xact.set(shuffleFunc, (prevShuf) => !prevShuf);
  });
  const clickRepeat = () => repSet(!rep);
  const clickPlayPause = useMyTransaction(
    (xact) => () => onClickPlayPause(xact, audioRef),
  );

  const clickPrev = useMyTransaction((xact) => () => {
    if (hasPrevSong) {
      MaybePlayPrev(xact);
    }
  });
  const clickNext = useMyTransaction((xact) => () => {
    if (hasNextSong) {
      MaybePlayNext(xact);
    }
  });
  return (
    <span id="control-container">
      <span
        id="shuffle"
        className={shufClass}
        onClick={clickShuffle}
        title={GetHelperText(Keys.Shuffle)}
      >
        &nbsp;
      </span>
      <span
        id="prev"
        className={prevClass}
        onClick={clickPrev}
        title={GetHelperText(Keys.PreviousTrack)}
      >
        &nbsp;
      </span>
      <span
        id="play-pause"
        className={playPauseClass}
        onClick={clickPlayPause}
        title={GetHelperText(Keys.Play)}
      >
        &nbsp;
      </span>
      <span
        id="next"
        className={nextClass}
        onClick={clickNext}
        title={GetHelperText(Keys.NextTrack)}
      >
        &nbsp;
      </span>
      <span
        id="repeat"
        className={repClass}
        onClick={clickRepeat}
        title={GetHelperText(Keys.Repeat)}
      >
        &nbsp;
      </span>
      &nbsp;
    </span>
  );
}
