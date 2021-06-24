import { MakeError, Type } from '@freik/core-utils';
import { TransactionInterface_UNSTABLE } from 'recoil';
import { FocusSearch } from '../MyWindow';
import { MaybePlayNext, MaybePlayPrev } from '../Recoil/api';
import { mediaTimeState } from '../Recoil/MediaPlaying';
import {
  CurrentView,
  curViewFunc,
  mutedState,
  repeatState,
  shuffleState,
  volumeState,
} from '../Recoil/ReadWrite';
import { onClickPlayPause } from './PlaybackControls';
import { GetAudioElem } from './SongPlaying';
import { addLocation } from './Views/Settings';

const log = MakeError('MenuHandler'); // eslint-disable-line
const err = MakeError('MenuHandler-err'); // eslint-disable-line

function updateTime({ set }: TransactionInterface_UNSTABLE, offset: number) {
  const ae = GetAudioElem();
  if (!ae) {
    return;
  }
  const targetTime = Math.min(
    ae.duration,
    Math.max(0, ae.currentTime + offset),
  );
  // eslint-disable-next-line id-blacklist
  if (targetTime < Number.MAX_SAFE_INTEGER && targetTime >= 0) {
    ae.currentTime = targetTime;
  }
  set(mediaTimeState, { position: targetTime, duration: ae.duration });
}

export function MenuHandler(
  xact: TransactionInterface_UNSTABLE,
  message: unknown,
): void {
  log('Menu command:');
  log(message);
  // I'm not really thrilled with this mechanism. String-based dispatch sucks
  if (Type.hasStr(message, 'state')) {
    switch (message.state) {
      case 'shuffle':
        xact.set(shuffleState, (cur) => !cur);
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
        onClickPlayPause(xact);
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
        if (Type.hasStr(message, 'select')) {
          let theView: CurrentView = CurrentView.none;
          switch (message.select) {
            case 'NowPlaying':
              theView = CurrentView.current;
              break;
            case 'Artists':
              theView = CurrentView.artist;
              break;
            case 'Albums':
              theView = CurrentView.album;
              break;
            case 'Songs':
              theView = CurrentView.song;
              break;
            case 'Playlists':
              theView = CurrentView.playlist;
              break;
            case 'Settings':
              theView = CurrentView.settings;
              break;
            default:
              err('Invalid view selection: ' + message.select);
              break;
          }
          if (theView !== CurrentView.none) {
            xact.set(curViewFunc, theView);
          }
        } else {
          err('Invalid view menu message:');
          err(message);
        }
        break;
      default:
        err('Unknown menu message:');
        err(message);
        break;
    }
  } else {
    err('Malformed menu message:');
    err(message);
  }
}
