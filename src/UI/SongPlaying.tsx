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
import { playOrderDisplayingAtom } from '../Jotai/Local';
import {
  MediaTime,
  mediaTimeAtom,
  mediaTimePercentAtom,
  mediaTimePositionAtom,
  mediaTimeRemainingAtom,
  playingAtom,
} from '../Jotai/MediaPlaying';
import {
  SongDescription,
  albumKeyForSongKeyAtomFam,
  allSongsAtom,
  dataForSongAtomFam,
} from '../Jotai/MusicDatabase';
import {
  mutedAtom,
  repeatAtom,
  shuffleAtom,
  volumeAtom,
} from '../Jotai/SimpleSettings';
import { currentSongKeyAtom, songListAtom } from '../Jotai/SongsPlaying';
import { getAlbumImageUrl, isMutableRefObject } from '../Tools';
import { SongDetailClick } from './DetailPanel/Clickers';
import { mySliderStyles } from './Utilities';
import './styles/SongPlaying.css';

const { log } = MakeLog('EMP:render:SongPlayback');
// log.enabled = true;
// const log = console.log;

function CoverArt(): JSX.Element {
  const songKey = useAtomValue(currentSongKeyAtom);
  const albumKey = useAtomValue(albumKeyForSongKeyAtomFam(songKey));
  const picurl = getAlbumImageUrl(albumKey);
  return (
    <span id="song-cover-art">
      <img id="img-current-cover-art" src={picurl} alt="album cover" />
    </span>
  );
}

function MediaTimePosition(): JSX.Element {
  const mediaTimePosition = useAtomValue(mediaTimePositionAtom);
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
  const mediaTimeRemaining = useAtomValue(mediaTimeRemainingAtom);
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
  const songKey = useAtomValue(currentSongKeyAtom);
  const [mediaTimePercent, setMediaTimePercent] = useAtom(mediaTimePercentAtom);
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
  const songKey = useAtomValue(currentSongKeyAtom);
  const { title }: SongDescription = useAtomValue(dataForSongAtomFam(songKey));
  return (
    <Text id="song-name" variant="tiny" block={true} nowrap={true}>
      {title}
    </Text>
  );
}

function ArtistAlbum(): JSX.Element {
  const songKey = useAtomValue(currentSongKeyAtom);
  const { artist, album }: SongDescription = useAtomValue(
    dataForSongAtomFam(songKey),
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SongPlaying = forwardRef(
  (_props, audioRef: ForwardedRef<HTMLAudioElement>): JSX.Element => {
    const songKey = useAtomValue(currentSongKeyAtom);
    const isShuffle = useAtomValue(shuffleAtom);
    const isMuted = useAtomValue(mutedAtom);
    const volumeLevel = useAtomValue(volumeAtom);
    const playbackPercent = useAtomValue(mediaTimePercentAtom);
    const setPlaying = useSetAtom(playingAtom);
    const setMediaTime = useSetAtom(mediaTimeAtom);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const store = useStore();
    const songList = useAtomValue(songListAtom);
    const rep = useAtomValue(repeatAtom);
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
    const metadata = useAtomValue(dataForSongAtomFam(songKey));
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
        // eslint-disable-next-line id-blacklist
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
          const sm = await store.get(allSongsAtom);
          const theSong = sm.get(songKey);
          if (theSong) {
            SongDetailClick(theSong, event.shiftKey);
          }
        }
      },
    );
    const flipDisplay = useAtomCallback(
      useCallback(
        (_get, set) => () => set(playOrderDisplayingAtom, (prv) => !prv),
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
