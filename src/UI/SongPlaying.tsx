import { Slider, Text } from '@fluentui/react';
import { ListIcon } from '@fluentui/react-icons-mdl2';
import { MakeLog } from '@freik/logger';
import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import {
  ForwardedRef,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
} from 'react';
import { AsyncHandler } from '../Jotai/Helpers';
import { MaybePlayNext } from '../Jotai/Interface';
import { playOrderDisplayingState } from '../Jotai/Local';
import {
  MediaTime,
  mediaTimePercentFunc,
  mediaTimePositionFunc,
  mediaTimeRemainingFunc,
  mediaTimeState,
  playingState,
} from '../Jotai/MediaPlaying';
import {
  SongDescription,
  albumKeyForSongKeyFuncFam,
  allSongsFunc,
  dataForSongFuncFam,
} from '../Jotai/MusicDatabase';
import {
  mutedState,
  repeatState,
  shuffleState,
  volumeState,
} from '../Jotai/SimpleSettings';
import { currentSongKeyFunc, songListState } from '../Jotai/SongsPlaying';
import { getAlbumImageUrl, isMutableRefObject } from '../Tools';
import { SongDetailClick } from './DetailPanel/Clickers';
import { mySliderStyles } from './Utilities';
import './styles/SongPlaying.css';

const { log } = MakeLog('EMP:render:SongPlayback');
// log.enabled = true;
// const log = console.log;

function CoverArt(): JSX.Element {
  const songKey = useAtomValue(currentSongKeyFunc);
  const albumKey = useAtomValue(albumKeyForSongKeyFuncFam(songKey));
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
  const songKey = useAtomValue(currentSongKeyFunc);
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
  const songKey = useAtomValue(currentSongKeyFunc);
  const { title }: SongDescription = useAtomValue(dataForSongFuncFam(songKey));
  return (
    <Text id="song-name" variant="tiny" block={true} nowrap={true}>
      {title}
    </Text>
  );
}

function ArtistAlbum(): JSX.Element {
  const songKey = useAtomValue(currentSongKeyFunc);
  const { artist, album }: SongDescription = useAtomValue(
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
    const songKey = useAtomValue(currentSongKeyFunc);
    const isShuffle = useAtomValue(shuffleState);
    const isMuted = useAtomValue(mutedState);
    const volumeLevel = useAtomValue(volumeState);
    const playbackPercent = useAtomValue(mediaTimePercentFunc);
    const setPlaying = useSetAtom(playingState);
    const setMediaTime = useSetAtom(mediaTimeState);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const store = useStore();
    const songList = useAtomValue(songListState);
    const rep = useAtomValue(repeatState);
    const onEnded = AsyncHandler(async () => {
      log('Heading to the next song!!!');
      if (rep && songList.length === 1) {
        // Because we rely on auto-play, if we just try to play the same song
        // again, it won't start playing
        if (isMutableRefObject(audioRef)) {
          await audioRef.current.play();
        }
      } else {
        setPlaying(await MaybePlayNext(store));
      }
    });
    const onTimeUpdate = (ev: SyntheticEvent<HTMLMediaElement>) => {
      const ae = ev.currentTarget;
      log('time update');
      log(ev);

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
    const metadata = useAtomValue(dataForSongFuncFam(songKey));
    const picDataUri = getAlbumImageUrl(songKey);
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
    const showDetail = AsyncHandler(
      async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        if (songKey !== '') {
          const sm = await store.get(allSongsFunc);
          const theSong = sm.get(songKey);
          if (theSong) {
            SongDetailClick(theSong, event.shiftKey);
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
