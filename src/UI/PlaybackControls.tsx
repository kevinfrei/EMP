import { MakeLogger } from '@freik/core-utils';
import {
  CallbackInterface,
  useRecoilCallback,
  useRecoilState,
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
import { GetAudioElem } from './SongPlaying';
import './styles/PlaybackControls.css';

const log = MakeLogger('SongControls');
const err = MakeLogger('SongControls-err');

export function onClickPlayPause({ set }: CallbackInterface): void {
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
      ae.play().catch((e) => '');
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

  const clickShuffle = useRecoilCallback((cbInterface) => async () => {
    if (!cbInterface.snapshot.getLoadable(shuffleState).valueOrThrow()) {
      await ShufflePlaying(cbInterface);
    }
    cbInterface.set(shuffleState, (prevShuf) => !prevShuf);
  });
  const clickRepeat = () => repSet(!rep);
  const clickPlayPause = useRecoilCallback((cbInterface) => () =>
    onClickPlayPause(cbInterface),
  );

  const clickPrev = useRecoilCallback((cbInterface) => async () => {
    if (hasPrevSong) {
      await MaybePlayPrev(cbInterface);
    }
  });
  const clickNext = useRecoilCallback((cbInterface) => async () => {
    if (hasNextSong) {
      await MaybePlayNext(cbInterface);
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
