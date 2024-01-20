import { CurrentView } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import { hasStrField } from '@freik/typechk';
import { ForwardedRef } from 'react';
import { curViewAtom } from '../Jotai/CurrentView';
import { MyStore, getStore } from '../Jotai/Helpers';
import { MaybePlayNext, MaybePlayPrev } from '../Jotai/Interface';
import { mediaTimeAtom, mediaTimePercentAtom } from '../Jotai/MediaPlaying';
import { playlistAtomFam } from '../Jotai/Playlists';
import {
  mutedAtom,
  repeatAtom,
  shuffleAtom,
  volumeAtom,
} from '../Jotai/SimpleSettings';
import { activePlaylistAtom, songListAtom } from '../Jotai/SongsPlaying';
import { FocusSearch } from '../MyWindow';
import { onClickPlayPause } from './PlaybackControls';
import { addLocation } from './Views/Settings';

const { wrn, log } = MakeLog('EMP:render:MenuHandler');
// log.enabled = true;

function updateTime(store: MyStore, offset: number) {
  const curTime = store.get(mediaTimeAtom);
  const position = Math.min(
    curTime.duration,
    Math.max(0, curTime.position + offset),
  );
  // eslint-disable-next-line id-blacklist
  if (position < Number.MAX_SAFE_INTEGER && position >= 0) {
    store.set(mediaTimeAtom, { position, duration: curTime.duration });
    store.set(mediaTimePercentAtom, position / curTime.duration);
  }
}

export async function MenuHandler(
  message: unknown,
  audioRef: ForwardedRef<HTMLAudioElement>,
): Promise<void> {
  const store = getStore();
  wrn('Menu command:', message);
  log('Menu command:', message);
  // I'm not really thrilled with this mechanism. String-based dispatch sucks
  if (hasStrField(message, 'state')) {
    switch (message.state) {
      case 'savePlaylist': {
        const nowPlaying = await store.get(activePlaylistAtom);
        const songList = await store.get(songListAtom);
        await store.set(playlistAtomFam(nowPlaying), songList);
        break;
      }
      case 'shuffle':
        await store.set(shuffleAtom, !(await store.get(shuffleAtom)));
        break;
      case 'repeat':
        await store.set(repeatAtom, !(await store.get(repeatAtom)));
        break;

      case 'addLocation':
        await addLocation(store);
        break;

      case 'find':
        FocusSearch();
        break;

      // Playback control:
      case 'playback':
        onClickPlayPause(store, audioRef);
        break;
      case 'nextTrack':
        await MaybePlayNext(store);
        break;
      case 'prevTrack':
        await MaybePlayPrev(store);
        break;

      // Time control
      case 'fwd':
        updateTime(store, 10);
        break;
      case 'back':
        updateTime(store, -10);
        break;

      case 'mute':
        void store.set(mutedAtom, async (cur) => !(await cur));
        break;
      case 'louder':
        void store.set(volumeAtom, async (val) =>
          Math.min(1.0, (await val) + 0.1),
        );
        break;
      case 'quieter':
        void store.set(volumeAtom, async (val) =>
          Math.max(0, (await val) - 0.1),
        );
        break;
      case 'view':
        if (hasStrField(message, 'select')) {
          let theView: CurrentView = CurrentView.none;
          switch (message.select) {
            case 'NowPlaying':
              theView = CurrentView.now_playing;
              break;
            case 'Artists':
              theView = CurrentView.artists;
              break;
            case 'Albums':
              theView = CurrentView.albums;
              break;
            case 'Songs':
              theView = CurrentView.songs;
              break;
            case 'Playlists':
              theView = CurrentView.playlists;
              break;
            case 'Settings':
              theView = CurrentView.settings;
              break;
            case 'Tools':
              theView = CurrentView.tools;
              break;
            default:
              wrn('Invalid view selection: ' + message.select);
              break;
          }
          if (theView !== CurrentView.none) {
            void store.set(curViewAtom, theView);
          }
        } else {
          wrn('Invalid view menu message:');
          wrn(message);
        }
        break;
      default:
        wrn('Unknown menu message:');
        wrn(message);
        break;
    }
  } else {
    wrn('Malformed menu message:');
    wrn(message);
  }
}
