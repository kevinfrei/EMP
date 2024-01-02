import { isArrayOfString, isBoolean, isNumber, isString } from '@freik/typechk';
import { atomWithMainStorage } from './Storage';

export const mutedState = atomWithMainStorage('mute', false, isBoolean);

export const volumeState = atomWithMainStorage('volume', 0.5, isNumber);

export const repeatState = atomWithMainStorage('repeat', false, isBoolean);

// This is the 'locations' for searching for tunes
export const locationsState = atomWithMainStorage(
  'locations',
  [],
  isArrayOfString,
);

export const defaultLocationState = atomWithMainStorage(
  'defaultLocation',
  '',
  isString,
);

// Sort with/without articles setting
export const ignoreArticlesState = atomWithMainStorage(
  'rSortWithArticles',
  true,
  isBoolean,
);

// Only show artists in the list who appear on full albums
export const showArtistsWithFullAlbumsState = atomWithMainStorage(
  'FullAlbumsOnly',
  false,
  isBoolean,
);

export const downloadAlbumArtworkState = atomWithMainStorage(
  'downloadAlbumArtwork',
  false,
  isBoolean,
);

export const downloadArtistArtworkState = atomWithMainStorage(
  'downloadArtistArtwork',
  false,
  isBoolean,
);

export const saveAlbumArtworkWithMusicState = atomWithMainStorage(
  'saveAlbumArtworkWithMusic',
  false,
  isBoolean,
);

export const albumCoverNameState = atomWithMainStorage(
  'albumCoverName',
  '.CoverArt',
  isString,
);

// The minimum # of songs an artist needs to show up in the artist list
export const minSongCountForArtistListState = atomWithMainStorage(
  'MinSongCount',
  1,
  isNumber,
);
