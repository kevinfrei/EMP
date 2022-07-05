import { Slider, Text } from '@fluentui/react';
import { ListIcon } from '@fluentui/react-icons-mdl2';
import { MakeLogger } from '@freik/core-utils';
import { useMyTransaction } from '@freik/web-utils';
import { SyntheticEvent, useEffect } from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { MaybePlayNext } from '../Recoil/api';
import { albumCoverUrlFuncFam } from '../Recoil/ImageUrls';
import { playOrderDisplayingState } from '../Recoil/Local';
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
  SongDescription,
} from '../Recoil/ReadOnly';
import { repeatState, shuffleFunc } from '../Recoil/ReadWrite';
import { currentSongKeyFunc, songListState } from '../Recoil/SongPlaying';
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
  const { title }: SongDescription = useRecoilValue(
    dataForSongFuncFam(songKey),
  );
  return (
    <Text id="song-name" variant="tiny" block={true} nowrap={true}>
      {title}
    </Text>
  );
}

function ArtistAlbum(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyFunc);
  const { artist, album }: SongDescription = useRecoilValue(
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

export function SongPlaying(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyFunc);
  const isShuffle = useRecoilValue(shuffleFunc);
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
  const metadata = useRecoilValue(dataForSongFuncFam(songKey));
  useEffect(() => {
    navigator.mediaSession.metadata = new MediaMetadata({
      artist: metadata.artist,
      album: metadata.album,
      title: metadata.title,
      artwork: [
        {
          src: 'data:image/png;base64,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',
        },
      ],
    });
  }, [songKey, metadata]);
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
  const flipDisplay = useRecoilCallback(
    ({ set }) =>
      () =>
        set(playOrderDisplayingState, (prv) => !prv),
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
      <ListIcon
        id="showPlayOrder"
        onClick={flipDisplay}
        style={{
          width: '12px',
          display: isShuffle ? 'block' : 'none',
          cursor: 'pointer',
        }}
      />
    </span>
  );
}
