import { Keys, KeysEnum } from '@freik/emp-shared';

const HostOs: 'mac' | 'windows' | 'linux' = (() => {
  const ua = window.navigator.userAgent;
  if (ua.indexOf('Mac') >= 0) {
    return 'mac';
  }
  if (ua.indexOf('Windows') >= 0) {
    return 'windows';
  }
  return 'linux';
})();

const accPrefix = HostOs === 'mac' ? '⌘' : 'Ctrl';

export function GetHelperText(key: KeysEnum) {
  if (key.length === 1) {
    return `${accPrefix}-${key}`;
  }
  if (key === Keys.PreviousTrack) {
    return accPrefix + '-←';
  }
  if (key === Keys.NextTrack) {
    return accPrefix + '-→';
  }
}
