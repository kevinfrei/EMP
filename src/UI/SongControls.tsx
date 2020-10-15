import { MakeLogger } from '@freik/core-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { MaybePlayNext, MaybePlayPrev, ShufflePlaying } from '../Recoil/api';
import {
  hasAnySongsSel,
  hasNextSongSel,
  hasPrevSongSel,
  playingAtom,
  repeatAtom,
  shuffleAtom,
} from '../Recoil/Local';
import { GetAudioElem } from './SongPlayback';
import './styles/SongControls.css';

const log = MakeLogger('SongControls');

export default function SongControls(): JSX.Element {
  const [isPlaying, setIsPlaying] = useRecoilState(playingAtom);

  const hasAnySong = useRecoilValue(hasAnySongsSel);
  const shuf = useRecoilValue(shuffleAtom);
  const [rep, repSet] = useRecoilState(repeatAtom);
  const hasNextSong = useRecoilValue(hasNextSongSel);
  const hasPrevSong = useRecoilValue(hasPrevSongSel);

  const shufClass = shuf ? 'enabled' : 'disabled';
  const repClass = rep ? 'enabled' : 'disabled';
  const playPauseClass = isPlaying
    ? 'playing'
    : hasAnySong
    ? 'paused'
    : 'paused disabled';
  const nextClass = hasNextSong ? 'enabled' : 'disabled';
  const prevClass = hasPrevSong ? 'enabled' : 'disabled';

  const clickShuffle = useRecoilCallback(({ set, snapshot }) => async () => {
    if (!(await snapshot.getPromise(shuffleAtom))) {
      await ShufflePlaying(snapshot, set);
    }
    set(shuffleAtom, (prevShuf) => !prevShuf);
  });
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
  const clickPrev = useRecoilCallback(({ set, snapshot }) => async () => {
    if (hasPrevSong) {
      await MaybePlayPrev(snapshot, set);
    }
  });
  const clickNext = useRecoilCallback(({ set, snapshot }) => async () => {
    if (hasNextSong) {
      await MaybePlayNext(snapshot, set);
    }
  });
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
