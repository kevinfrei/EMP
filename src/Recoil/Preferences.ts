import { Effects } from '@freik/electron-render';
import { atom } from 'recoil';

// Only show artists in the list who appear on full albums

export const showArtistsWithFullAlbumsState = atom({
  key: 'FullAlbumsOnly',
  default: false,
  effects: [Effects.syncWithMain<boolean>()],
});
// The minimum # of songs an artist needs to show up in the artist list

export const minSongCountForArtistListState = atom({
  key: 'MinSongCount',
  default: 1,
  effects: [Effects.syncWithMain<number>()],
});
