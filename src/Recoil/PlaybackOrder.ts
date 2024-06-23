import { Effects } from '@freik/electron-render';
import { atom } from 'recoil';

// const log = MakeLogger('ReadWrite');
// const err = MakeError('ReadWrite-err');
export const shuffleState = atom<boolean>({
  key: 'shuffle',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});

export const repeatState = atom<boolean>({
  key: 'repeat',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});
