import { CurrentView, CurrentViewEnum } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import { hasStrField } from '@freik/typechk';
import { MyTransactionInterface } from '@freik/web-utils';
import { ForwardedRef } from 'react';
import { MaybePlayNext, MaybePlayPrev } from '../Jotai/API';
import { curViewFunc } from '../Jotai/CurrentView';
import { mediaTimePercentFunc, mediaTimeState } from '../Jotai/MediaPlaying';
import { playlistStateFamily } from '../Jotai/PlaylistControl';
import { mutedState, volumeState } from '../Jotai/SimpleSettings';
import { repeatState, shuffleState } from '../Jotai/SongPlayback';
import { getStore, MaybeStore } from '../Jotai/Storage';
import { FocusSearch } from '../MyWindow';
import { activePlaylistState, songListState } from '../Recoil/SongPlaying';
import { onClickPlayPause } from './PlaybackControls';
import { addLocation } from './Views/Settings';

const { wrn, log } = MakeLog('EMP:render:MenuHandler');
// log.enabled = true;

function updateTime(offset: number, mstore?: MaybeStore) {
  const store = getStore(mstore);
  const curTime = store.get(mediaTimeState);
  const position = Math.min(
    curTime.duration,
    Math.max(0, curTime.position + offset),
  );

  if (position < Number.MAX_SAFE_INTEGER && position >= 0) {
    store.set(mediaTimeState, { position, duration: curTime.duration });
    store.set(mediaTimePercentFunc, position / curTime.duration);
  }
}

export function MenuHandler(
  xact: MyTransactionInterface,
  message: unknown,
  audioRef: ForwardedRef<HTMLAudioElement>,
): void {
  wrn('Menu command:', message);
  log('Menu command:', message);
  // I'm not really thrilled with this mechanism. String-based dispatch sucks
  const store = getStore();
  if (hasStrField(message, 'state')) {
    switch (message.state) {
      case 'shuffle':
        store.set(shuffleState, !store.get(shuffleState));
        break;
      case 'repeat':
        store.set(repeatState, !store.get(repeatState));
        break;

      case 'savePlaylist': {
        const nowPlaying = xact.get(activePlaylistState);
        const songList = xact.get(songListState);
        store.set(playlistStateFamily(nowPlaying), songList);
        break;
      }

      case 'addLocation':
        addLocation(xact).catch(wrn);
        break;

      case 'find':
        FocusSearch();
        break;

      // Playback control:
      case 'playback':
        onClickPlayPause(audioRef);
        break;
      case 'nextTrack':
        MaybePlayNext().catch(wrn);
        break;
      case 'prevTrack':
        MaybePlayPrev().catch(wrn);
        break;

      // Time control
      case 'fwd':
        updateTime(10);
        break;
      case 'back':
        updateTime(-10);
        break;

      case 'mute':
        store.set(mutedState, async (cur) => !(await cur)).catch(wrn);
        break;
      case 'louder':
        store
          .set(volumeState, async (val) => Math.min(1.0, (await val) + 0.1))
          .catch(wrn);
        break;
      case 'quieter':
        store
          .set(volumeState, async (val) => Math.max(0, (await val) - 0.1))
          .catch(wrn);
        break;
      case 'view':
        if (hasStrField(message, 'select')) {
          let theView: CurrentViewEnum = CurrentView.none;
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
            store.set(curViewFunc, theView).catch(wrn);
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
