import { MakeLog } from '@freik/logger';
import { hasStrField } from '@freik/typechk';
import { MyTransactionInterface } from '@freik/web-utils';
import { ForwardedRef } from 'react';
import { CurrentView } from '@freik/emp-shared';
import { FocusSearch } from '../MyWindow';
import { mediaTimePercentFunc, mediaTimeState } from '../Recoil/MediaPlaying';
import { playlistFuncFam } from '../Recoil/PlaylistsState';
import {
  curViewFunc,
  mutedState,
  repeatState,
  shuffleFunc,
  volumeState,
} from '../Recoil/ReadWrite';
import { activePlaylistState, songListState } from '../Recoil/SongPlaying';
import { MaybePlayNext, MaybePlayPrev } from '../Recoil/api';
import { onClickPlayPause } from './PlaybackControls';
import { addLocation } from './Views/Settings';

const { wrn, log } = MakeLog('EMP:render:MenuHandler');
log.enabled = true;

function updateTime({ set, get }: MyTransactionInterface, offset: number) {
  const curTime = get(mediaTimeState);
  const position = Math.min(
    curTime.duration,
    Math.max(0, curTime.position + offset),
  );
  // eslint-disable-next-line id-blacklist
  if (position < Number.MAX_SAFE_INTEGER && position >= 0) {
    set(mediaTimeState, { position, duration: curTime.duration });
    set(mediaTimePercentFunc, position / curTime.duration);
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
  if (hasStrField(message, 'state')) {
    switch (message.state) {
      case 'savePlaylist': {
        const nowPlaying = xact.get(activePlaylistState);
        const songList = xact.get(songListState);
        xact.set(playlistFuncFam(nowPlaying), songList);
        break;
      }
      case 'shuffle':
        xact.set(shuffleFunc, (cur) => !cur);
        break;
      case 'repeat':
        xact.set(repeatState, (cur) => !cur);
        break;

      case 'addLocation':
        void addLocation(xact);
        break;

      case 'find':
        FocusSearch();
        break;

      // Playback control:
      case 'playback':
        onClickPlayPause(xact, audioRef);
        break;
      case 'nextTrack':
        void MaybePlayNext(xact);
        break;
      case 'prevTrack':
        void MaybePlayPrev(xact);
        break;

      // Time control
      case 'fwd':
        updateTime(xact, 10);
        break;
      case 'back':
        updateTime(xact, -10);
        break;

      case 'mute':
        xact.set(mutedState, (cur) => !cur);
        break;
      case 'louder':
        xact.set(volumeState, (val) => Math.min(1.0, val + 0.1));
        break;
      case 'quieter':
        xact.set(volumeState, (val) => Math.max(0, val - 0.1));
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
            xact.set(curViewFunc, theView);
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
