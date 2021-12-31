import { MakeLogger } from '@freik/core-utils';
import {
  MyTransactionInterface,
  onRejected,
  useMyTransaction,
} from '@freik/web-utils';
import { useRecoilState, useRecoilValue } from 'recoil';
import { MaybePlayNext, MaybePlayPrev } from '../Recoil/api';
import {
  hasAnySongsFunc,
  hasNextSongFunc,
  hasPrevSongFunc,
} from '../Recoil/LocalFuncs';
import { playingState } from '../Recoil/MediaPlaying';
import { repeatState, shuffleFunc } from '../Recoil/ReadWrite';
import { GetAudioElem } from './SongPlaying';
import './styles/PlaybackControls.css';
import { accPrefix } from './Utilities';

const log = MakeLogger('SongControls');
const err = MakeLogger('SongControls-err');

export function onClickPlayPause({ set }: MyTransactionInterface): void {
  const ae = GetAudioElem();
  if (!ae) {
    err('Clicking but no audio element');
    return;
  }
  set(playingState, (isPlaying) => {
    if (isPlaying) {
      ae.pause();
      return false;
    } else if (ae.readyState === 4) {
      ae.play().catch(onRejected('Audio Element play failed'));
      return true;
    } else {
      log(`We're not playing, but also not state 4: ${ae.readyState}`);
    }
    return isPlaying;
  });
}

export function PlaybackControls(): JSX.Element {
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
    (xact) => () => onClickPlayPause(xact),
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
        title={accPrefix + 'R'}
      >
        &nbsp;
      </span>
      <span
        id="prev"
        className={prevClass}
        onClick={clickPrev}
        title={accPrefix + '←'}
      >
        &nbsp;
      </span>
      <span
        id="play-pause"
        className={playPauseClass}
        onClick={clickPlayPause}
        title={accPrefix + 'P'}
      >
        &nbsp;
      </span>
      <span
        id="next"
        className={nextClass}
        onClick={clickNext}
        title={accPrefix + '→'}
      >
        &nbsp;
      </span>
      <span
        id="repeat"
        className={repClass}
        onClick={clickRepeat}
        title={accPrefix + 'T'}
      >
        &nbsp;
      </span>
      &nbsp;
    </span>
  );
}
