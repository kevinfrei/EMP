import { Slider, Text } from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import { SyntheticEvent } from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { MaybePlayNext } from '../Recoil/api';
import {
  albumCoverUrlFamily,
  currentSongKeyState,
  songListState,
} from '../Recoil/Local';
import {
  MediaTime,
  mediaTimePercentState,
  mediaTimePositionState,
  mediaTimeRemainingState,
  mediaTimeState,
  playingState,
} from '../Recoil/MediaPlaying';
import {
  allSongsState,
  getAlbumKeyForSongKeyFamily,
  getDataForSongFamily,
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
  const songKey = useRecoilValue(currentSongKeyState);
  const albumKey = useRecoilValue(getAlbumKeyForSongKeyFamily(songKey));
  const picurl = useRecoilValue(albumCoverUrlFamily(albumKey));
  return (
    <span id="song-cover-art">
      <img id="img-current-cover-art" src={picurl} alt="album cover" />
    </span>
  );
}

function MediaTimePosition(): JSX.Element {
  const mediaTimePosition = useRecoilValue(mediaTimePositionState);
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
  const mediaTimeRemaining = useRecoilValue(mediaTimeRemainingState);
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
  const songKey = useRecoilValue(currentSongKeyState);
  const [mediaTimePercent, setMediaTimePercent] = useRecoilState(
    mediaTimePercentState,
  );
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
  const songKey = useRecoilValue(currentSongKeyState);
  const { title }: SongData = useRecoilValue(getDataForSongFamily(songKey));
  return (
    <Text id="song-name" variant="tiny" block={true} nowrap={true}>
      {title}
    </Text>
  );
}

function ArtistAlbum(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyState);
  const { artist, album }: SongData = useRecoilValue(
    getDataForSongFamily(songKey),
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
  const songKey = useRecoilValue(currentSongKeyState);
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
  const onEnded = useRecoilCallback((cbInterface) => async () => {
    const { snapshot, set } = cbInterface;
    log('Heading to the next song!!!');
    const release = snapshot.retain();
    try {
      const songList = await snapshot.getPromise(songListState);
      const rep = await snapshot.getPromise(repeatState);
      if (rep && songList.length === 1) {
        // Because we rely on auto-play, if we just try to play the same song
        // again, it won't start playing
        const ae = GetAudioElem();
        if (ae) {
          await ae.play();
        }
      }
      const isPlaying = await MaybePlayNext(cbInterface);
      set(playingState, isPlaying);
    } finally {
      release();
    }
  });
  const onTimeUpdate = useRecoilCallback(
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
  const showDetail = useRecoilCallback(
    (cbInterface) => (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      if (songKey !== '') {
        const release = cbInterface.snapshot.retain();
        cbInterface.snapshot
          .getPromise(allSongsState)
          .then((songs) => {
            const song = songs.get(songKey);
            if (song) {
              SongDetailClick(cbInterface, song, event.shiftKey);
            }
          })
          .finally(release);
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
