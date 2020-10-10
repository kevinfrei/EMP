import { Slider, Text } from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue } from 'recoil';
import { MaybePlayNextSong } from '../Recoil/api';
import {
  currentIndexAtom,
  currentSongKeySel,
  mediaTimeAtom,
  mediaTimePercentRWSel,
  mediaTimePositionSel,
  mediaTimeRemainingSel,
  playingAtom,
  repeatAtom,
  shuffleAtom,
  songListAtom,
} from '../Recoil/Local';
import {
  albumKeyForSongKeySel,
  dataForSongSel,
  SongData,
} from '../Recoil/ReadOnly';
import './styles/SongPlayback.css';

const log = MakeLogger('SongPlayback');

export function GetAudioElem(): HTMLMediaElement | void {
  return document.getElementById('audioElement') as HTMLMediaElement;
}

function CoverArt(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeySel);
  const albumKey = useRecoilValue(albumKeyForSongKeySel(songKey));

  return (
    <span id="song-cover-art">
      <img
        id="current-cover-art"
        src={`pic://album/${albumKey}`}
        alt="album cover"
      />
    </span>
  );
}

function MediaTimePosition(): JSX.Element {
  const mediaTimePosition = useRecoilValue(mediaTimePositionSel);
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
  const mediaTimeRemaining = useRecoilValue(mediaTimeRemainingSel);
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
  const songKey = useRecoilValue(currentSongKeySel);
  const [mediaTimePercent, setMediaTimePercent] = useRecoilState(
    mediaTimePercentRWSel,
  );
  return (
    <Slider
      className="song-slider"
      value={mediaTimePercent}
      min={0}
      max={1}
      disabled={songKey.length === 0}
      step={1e-5}
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
  const songKey = useRecoilValue(currentSongKeySel);
  const { title }: SongData = useRecoilValue(dataForSongSel(songKey));
  return (
    <Text id="song-name" variant="tiny" block={true} nowrap={true}>
      {title}
    </Text>
  );
}

function ArtistAlbum(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeySel);
  const { artist, album }: SongData = useRecoilValue(dataForSongSel(songKey));
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
  const [mediaTime, setMediaTime] = useRecoilState(mediaTimeAtom);
  let audio: React.ReactElement<HTMLAudioElement>;
  const songKey = useRecoilValue(currentSongKeySel);
  const [, setPlaying] = useRecoilState(playingAtom);
  const [curIndex, setCurIndex] = useRecoilState(currentIndexAtom);
  const [songList, setSongList] = useRecoilState(songListAtom);
  const rep = useRecoilValue(repeatAtom);
  const shuf = useRecoilValue(shuffleAtom);
  const maybeNextSong = () => {
    log('Heading to the next song!!!');
    if (rep && songList.length === 1) {
      // Because we rely on auto-play, if we just try to play the same song
      // again, it won't start playing
      const ae = GetAudioElem();
      if (ae) {
        ae.play().catch((reason) => log("couldn't restart playing"));
      }
    }
    setPlaying(
      MaybePlayNextSong(
        curIndex,
        setCurIndex,
        rep,
        shuf,
        songList,
        setSongList,
      ),
    );
  };
  if (songKey !== '') {
    audio = (
      <audio
        id="audioElement"
        autoPlay={true}
        src={'tune://song/' + songKey}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={maybeNextSong}
        onTimeUpdate={(ev: React.SyntheticEvent<HTMLMediaElement>) => {
          const ae = ev.target as HTMLMediaElement;
          if (
            !Number.isNaN(ae.duration) && // eslint-disable-line id-blacklist
            (Math.trunc(ae.duration) !== Math.trunc(mediaTime.duration) ||
              Math.trunc(ae.currentTime) !== Math.trunc(mediaTime.position))
          ) {
            log(
              `${ae.readyState}: Duration: ${ae.duration} Current time: ${ae.currentTime}`,
            );
            setMediaTime({ position: ae.currentTime, duration: ae.duration });
          }
        }}
      />
    ) as React.ReactElement<HTMLAudioElement>;
  } else {
    audio = <audio id="audioElement" />;
  }
  return (
    <span id="song-container">
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
