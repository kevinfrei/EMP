import { isBoolean, isNumber } from '@freik/typechk';
import { atomFromMain } from './Storage';

// Only show artists in the list who appear on full albums

export const showArtistsWithFullAlbumsState = atomFromMain(
  'FullAlbumsOnly',
  isBoolean,
);
// The minimum # of songs an artist needs to show up in the artist list

export const minSongCountForArtistListState = atomFromMain(
  'MinSongCount',
  isNumber,
);
