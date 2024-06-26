import { Keys } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import { onRejected, useMyTransaction } from '@freik/web-utils';
import { useAtomValue, useStore } from 'jotai';
import { ForwardedRef, MouseEventHandler } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { playingState } from '../Jotai/MediaPlaying';
import { MyStore } from '../Jotai/Storage';
import { repeatState } from '../Recoil/PlaybackOrder';
import { shuffleFunc } from '../Recoil/ReadWrite';
import {
  hasAnySongsFunc,
  hasNextSongFunc,
  hasPrevSongFunc,
} from '../Recoil/SongPlaying';
import { MaybePlayNext, MaybePlayPrev } from '../Recoil/api';
import { isMutableRefObject } from '../Tools';
import { GetHelperText } from './MenuHelpers';
import './styles/PlaybackControls.css';

const { log, wrn } = MakeLog('EMP:render:SongControls');

export function onClickPlayPause(
  store: MyStore,
  audioRef: ForwardedRef<HTMLAudioElement>,
): void {
  if (!isMutableRefObject<HTMLAudioElement>(audioRef)) {
    wrn('Clicking but no audio element');
    return;
  }
  store.set(playingState, (isPlaying) => {
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
  const isPlaying = useAtomValue(playingState);

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
  const store = useStore();
  const clickPlayPause = () => onClickPlayPause(store, audioRef);

  const clickPrev = useMyTransaction((xact) => () => {
    if (hasPrevSong) {
      MaybePlayPrev(xact);
    }
  });
  const clickNext: MouseEventHandler<HTMLSpanElement> = useMyTransaction(
    (xact) => (ev) => {
      if (hasNextSong) {
        MaybePlayNext(
          xact,
          ev.altKey || ev.shiftKey || ev.ctrlKey || ev.metaKey,
        );
      }
    },
  );
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
