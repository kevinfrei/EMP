import { Slider, Text } from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import { useMyTransaction } from '@freik/web-utils';
import { SyntheticEvent } from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { MaybePlayNext } from '../Recoil/api';
import {
  albumCoverUrlFuncFam,
  currentSongKeyFunc,
  songListState,
} from '../Recoil/Local';
import {
  MediaTime,
  mediaTimePercentFunc,
  mediaTimePositionFunc,
  mediaTimeRemainingFunc,
  mediaTimeState,
  playingState,
} from '../Recoil/MediaPlaying';
import {
  albumKeyForSongKeyFuncFam,
  allSongsFunc,
  dataForSongFuncFam,
  SongData,
} from '../Recoil/ReadOnly';
import { repeatState } from '../Recoil/ReadWrite';
import { SongDetailClick } from './DetailPanel/Clickers';
import './styles/SongPlaying.css';
import { mySliderStyles } from './Utilities';

const log = MakeLogger('SongPlayback');

export function GetAudioElem(): HTMLMediaElement | void {
  return document.getElementById('audioElement') as HTMLMediaElement;
}

function CoverArt(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyFunc);
  const albumKey = useRecoilValue(albumKeyForSongKeyFuncFam(songKey));
  const picurl = useRecoilValue(albumCoverUrlFuncFam(albumKey));
  return (
    <span id="song-cover-art">
      <img id="img-current-cover-art" src={picurl} alt="album cover" />
    </span>
  );
}

function MediaTimePosition(): JSX.Element {
  const mediaTimePosition = useRecoilValue(mediaTimePositionFunc);
  return (
    <Text
      id="now-playing-current-time"
      variant="tiny"
      block={true}
      nowrap={true}
    >
      {mediaTimePosition}
    </Text>
  );
}

function MediaTimeRemaining(): JSX.Element {
  const mediaTimeRemaining = useRecoilValue(mediaTimeRemainingFunc);
  return (
    <Text
      id="now-playing-remaining-time"
      variant="tiny"
      block={true}
      nowrap={true}
    >
      {mediaTimeRemaining}
    </Text>
  );
}

function MediaTimeSlider(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyFunc);
  const [mediaTimePercent, setMediaTimePercent] =
    useRecoilState(mediaTimePercentFunc);
  return (
    <Slider
      className="song-slider" /* Can't put an ID on a slider :( */
      value={mediaTimePercent}
      min={0}
      max={1}
      disabled={songKey.length === 0}
      step={1e-5}
      styles={mySliderStyles}
      onChange={(value: number) => {
        const ae = GetAudioElem();
        if (!ae) {
          return;
        }
        const targetTime = ae.duration * value;
        // eslint-disable-next-line id-blacklist
        if (targetTime < Number.MAX_SAFE_INTEGER && targetTime >= 0) {
          ae.currentTime = ae.duration * value;
        }
        setMediaTimePercent(value);
      }}
      showValue={false}
    />
  );
}

function SongName(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyFunc);
  const { title }: SongData = useRecoilValue(dataForSongFuncFam(songKey));
  return (
    <Text id="song-name" variant="tiny" block={true} nowrap={true}>
      {title}
    </Text>
  );
}

function ArtistAlbum(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyFunc);
  const { artist, album }: SongData = useRecoilValue(
    dataForSongFuncFam(songKey),
  );
  if (songKey) {
    const split = artist.length && album.length ? ': ' : '';
    return (
      <Text
        id="artist-album"
        variant="tiny"
        block={true}
        nowrap={true}
      >{`${artist}${split}${album}`}</Text>
    );
  } else {
    return <span id="artist-album" />;
  }
}

export default function SongPlayback(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyFunc);
  const onPlay = useRecoilCallback(
    ({ set }) =>
      () =>
        set(playingState, true),
  );
  const onPause = useRecoilCallback(
    ({ set }) =>
      () =>
        set(playingState, false),
  );
  const onEnded = useMyTransaction((xact) => () => {
    log('Heading to the next song!!!');
    const songList = xact.get(songListState);
    const rep = xact.get(repeatState);
    if (rep && songList.length === 1) {
      // Because we rely on auto-play, if we just try to play the same song
      // again, it won't start playing
      const ae = GetAudioElem();
      if (ae) {
        void ae.play();
      }
    } else {
      xact.set(playingState, MaybePlayNext(xact));
    }
  });
  const onTimeUpdate = useMyTransaction(
    ({ set }) =>
      (ev: SyntheticEvent<HTMLMediaElement>) => {
        const ae = ev.currentTarget;
        // eslint-disable-next-line id-blacklist
        if (!Number.isNaN(ae.duration)) {
          set(mediaTimeState, (prevTime: MediaTime) => {
            if (
              Math.trunc(ae.duration) !== Math.trunc(prevTime.duration) ||
              Math.trunc(ae.currentTime) !== Math.trunc(prevTime.position)
            ) {
              return { position: ae.currentTime, duration: ae.duration };
            } else {
              return prevTime;
            }
          });
        }
      },
  );
  const audio = (
    <audio
      id="audioElement"
      autoPlay={true}
      src={songKey !== '' ? 'tune://song/' + songKey : ''}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
    />
  );
  const showDetail = useMyTransaction(
    (xact) => (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      if (songKey !== '') {
        const songs = xact.get(allSongsFunc);
        const song = songs.get(songKey);
        if (song) {
          SongDetailClick(xact, song, event.shiftKey);
        }
      }
    },
  );
  return (
    <span id="song-container" onAuxClick={showDetail}>
      <CoverArt />
      <SongName />
      <ArtistAlbum />
      <MediaTimePosition />
      <MediaTimeSlider />
      <MediaTimeRemaining />
      {audio}
    </span>
  );
}
