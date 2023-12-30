import { Slider, Text } from '@fluentui/react';
import { ListIcon } from '@fluentui/react-icons-mdl2';
import { MakeLog } from '@freik/logger';
import { useMyTransaction } from '@freik/web-utils';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import {
  ForwardedRef,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
} from 'react';
import { useRecoilValue } from 'recoil';
import { playOrderDisplayingState } from '../Jotai/Local';
import {
  MediaTime,
  mediaTimePercentFunc,
  mediaTimePositionFunc,
  mediaTimeRemainingFunc,
  mediaTimeState,
  playingState,
} from '../Jotai/MediaPlaying';
import { mutedState, volumeState } from '../Jotai/SimpleSettings';
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
import { getAlbumImageUrl, isMutableRefObject } from '../Tools';
import { SongDetailClick } from './DetailPanel/Clickers';
import { mySliderStyles } from './Utilities';
import './styles/SongPlaying.css';

const { log } = MakeLog('EMP:render:SongPlayback');
// log.enabled = true;
// const log = console.log;

function CoverArt(): JSX.Element {
  const songKey = useRecoilValue(currentSongKeyFunc);
  const albumKey = useRecoilValue(albumKeyForSongKeyFuncFam(songKey));
  const picurl = getAlbumImageUrl(albumKey);
  return (
    <span id="song-cover-art">
      <img id="img-current-cover-art" src={picurl} alt="album cover" />
    </span>
  );
}

function MediaTimePosition(): JSX.Element {
  const mediaTimePosition = useAtomValue(mediaTimePositionFunc);
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
  const mediaTimeRemaining = useAtomValue(mediaTimeRemainingFunc);
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
  const [mediaTimePercent, setMediaTimePercent] = useAtom(mediaTimePercentFunc);
  return (
    <Slider
      className="song-slider" /* Can't put an ID on a slider :( */
      value={mediaTimePercent}
      min={0}
      max={1}
      disabled={songKey.length === 0}
      step={1e-7}
      styles={mySliderStyles}
      onChange={(value: number) => {
        log('Change: ' + value);
        setMediaTimePercent(value);
      }}
      onChanged={(_, value: number) => {
        log('Changed:' + value);
        log(_);
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

export const SongPlaying = forwardRef(
  (_props, audioRef: ForwardedRef<HTMLAudioElement>): JSX.Element => {
    const songKey = useRecoilValue(currentSongKeyFunc);
    const isShuffle = useRecoilValue(shuffleFunc);
    const isMuted = useAtomValue(mutedState);
    const volumeLevel = useAtomValue(volumeState);
    const playbackPercent = useAtomValue(mediaTimePercentFunc);
    const setPlaying = useSetAtom(playingState);
    const setMediaTime = useSetAtom(mediaTimeState);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = useMyTransaction((xact) => (): void => {
      log('Heading to the next song!!!');
      const songList = xact.get(songListState);
      const rep = xact.get(repeatState);
      if (rep && songList.length === 1) {
        // Because we rely on auto-play, if we just try to play the same song
        // again, it won't start playing
        if (isMutableRefObject(audioRef)) {
          void audioRef.current.play();
        }
      } else {
        setPlaying(MaybePlayNext(xact));
      }
    });
    const onTimeUpdate = (ev: SyntheticEvent<HTMLMediaElement>) => {
      const ae = ev.currentTarget;
      log('time update');
      log(ev);
      // eslint-disable-next-line id-blacklist
      if (!Number.isNaN(ae.duration)) {
        setMediaTime((prevTime: MediaTime) => {
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
    };
    const metadata = useRecoilValue(dataForSongFuncFam(songKey));
    const picDataUri = useRecoilValue(picForKeyFam(songKey));
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
    useEffect(() => {
      if (isMutableRefObject(audioRef)) {
        audioRef.current.volume = volumeLevel * volumeLevel;
      }
    }, [audioRef, volumeLevel]);
    // TODO: Make this effect only trigger due to user intervention
    useEffect(() => {
      if (isMutableRefObject(audioRef)) {
        const targetTime = audioRef.current.duration * playbackPercent;
        const currentTime = audioRef.current.currentTime;

        if (
          targetTime < Number.MAX_SAFE_INTEGER &&
          targetTime >= 0 &&
          Math.abs(targetTime - currentTime) > 1.5
        ) {
          audioRef.current.currentTime = targetTime;
        }
      }
    }, [audioRef, playbackPercent]);
    const audio = (
      <audio
        ref={audioRef}
        autoPlay={true}
        src={songKey !== '' ? 'trune://song/' + songKey : ''}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
        muted={isMuted}
      />
    );
    const showDetail = useMyTransaction(
      (xact) => (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        if (songKey !== '') {
          const songs = xact.get(allSongsFunc);
          const song = songs.get(songKey);
          if (song) {
            SongDetailClick(song, event.shiftKey);
          }
        }
      },
    );
    const flipDisplay = useAtomCallback(
      useCallback(
        (_get, set) => () => set(playOrderDisplayingState, (prv) => !prv),
        [],
      ),
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
  },
);
