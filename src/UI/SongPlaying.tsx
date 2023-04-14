import { Slider, Text } from '@fluentui/react';
import { ListIcon } from '@fluentui/react-icons-mdl2';
import { useMyTransaction } from '@freik/web-utils';
import debug from 'debug';
import { SyntheticEvent, useEffect } from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
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
  SongDescription,
  albumKeyForSongKeyFuncFam,
  allSongsFunc,
  dataForSongFuncFam,
  picForKeyFam,
} from '../Recoil/ReadOnly';
import { repeatState, shuffleFunc } from '../Recoil/ReadWrite';
import { currentSongKeyFunc, songListState } from '../Recoil/SongPlaying';
import { MaybePlayNext } from '../Recoil/api';
import { SongDetailClick } from './DetailPanel/Clickers';
import { mySliderStyles } from './Utilities';
import './styles/SongPlaying.css';

const log = debug('EMP:render:SongPlayback');

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
  const picDataUri = useRecoilValue(picForKeyFam(songKey));
  log(picDataUri);
  useEffect(() => {
    navigator.mediaSession.metadata = new MediaMetadata({
      artist: metadata.artist,
      album: metadata.album,
      title: metadata.title,
      artwork: [
        {
          src: picDataUri,
        },
      ],
    });
  }, [songKey, metadata, picDataUri]);
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
