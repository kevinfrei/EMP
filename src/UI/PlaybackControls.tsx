import { MakeLogger } from '@freik/core-utils';
import {
  TransactionInterface_UNSTABLE,
  useRecoilState,
  useRecoilTransaction_UNSTABLE,
  useRecoilValue,
} from 'recoil';
import { MaybePlayNext, MaybePlayPrev, ShufflePlaying } from '../Recoil/api';
import {
  hasAnySongsState,
  hasNextSongState,
  hasPrevSongState,
} from '../Recoil/Local';
import { playingState } from '../Recoil/MediaPlaying';
import { repeatState, shuffleState } from '../Recoil/ReadWrite';
import { onRejected } from '../Tools';
import { GetAudioElem } from './SongPlaying';
import './styles/PlaybackControls.css';

const log = MakeLogger('SongControls');
const err = MakeLogger('SongControls-err');

export function onClickPlayPause({ set }: TransactionInterface_UNSTABLE): void {
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

export default function SongControls(): JSX.Element {
  const isPlaying = useRecoilValue(playingState);

  const hasAnySong = useRecoilValue(hasAnySongsState);
  const shuf = useRecoilValue(shuffleState);
  const [rep, repSet] = useRecoilState(repeatState);
  const hasNextSong = useRecoilValue(hasNextSongState);
  const hasPrevSong = useRecoilValue(hasPrevSongState);

  const shufClass = shuf ? 'enabled' : 'disabled';
  const repClass = rep ? 'enabled' : 'disabled';
  const playPauseClass = isPlaying
    ? 'playing'
    : hasAnySong
    ? 'paused'
    : 'paused disabled';
  const nextClass = hasNextSong ? 'enabled' : 'disabled';
  const prevClass = hasPrevSong ? 'enabled' : 'disabled';

  const clickShuffle = useRecoilTransaction_UNSTABLE((xact) => () => {
    if (!xact.get(shuffleState)) {
      ShufflePlaying(xact);
    }
    xact.set(shuffleState, (prevShuf) => !prevShuf);
  });
  const clickRepeat = () => repSet(!rep);
  const clickPlayPause = useRecoilTransaction_UNSTABLE(
    (xact) => () => onClickPlayPause(xact),
  );

  const clickPrev = useRecoilTransaction_UNSTABLE((xact) => () => {
    if (hasPrevSong) {
      MaybePlayPrev(xact);
    }
  });
  const clickNext = useRecoilTransaction_UNSTABLE((xact) => () => {
    if (hasNextSong) {
      MaybePlayNext(xact);
    }
  });
  return (
    <span id="control-container">
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
