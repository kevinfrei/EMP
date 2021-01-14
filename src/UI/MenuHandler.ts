import { FTONData, MakeError, Type } from '@freik/core-utils';
import { CallbackInterface } from 'recoil';
import {
  CurrentView,
  curViewState,
  repeatState,
  shuffleState,
} from '../Recoil/ReadWrite';

const err = MakeError('MenuHandler'); // eslint-disable-line

export function MenuHandler(
  { set }: CallbackInterface,
  message: FTONData,
): void {
  // I'm not really thrilled with this mechanism. String-based dispatch sucks
  if (Type.hasStr(message, 'state')) {
    switch (message.state) {
      case 'shuffle':
        set(shuffleState, (cur) => !cur);
        break;
      case 'repeat':
        set(repeatState, (cur) => !cur);
        break;
      case 'addLocation':
      case 'find':
      case 'MiniPlayer':
      case 'playback':
      case 'nextTrack':
      case 'prevTrack':
      case 'fwd':
      case 'back':
      case 'mute':
      case 'louder':
      case 'quieter':
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
            set(curViewState, theView);
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
