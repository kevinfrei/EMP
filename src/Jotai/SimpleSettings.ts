import { isArrayOfString, isBoolean, isNumber, isString } from '@freik/typechk';
import { atomWithMainStorage } from './Storage';

export const mutedAtom = atomWithMainStorage('mute', false, isBoolean);

export const volumeAtom = atomWithMainStorage('volume', 0.5, isNumber);

export const repeatAtom = atomWithMainStorage('repeat', false, isBoolean);

export const shuffleAtom = atomWithMainStorage('shuffle', false, isBoolean);

// This is the 'locations' for searching for tunes
export const locationsAtom = atomWithMainStorage(
  'locations',
  [],
  isArrayOfString,
);

export const defaultLocationAtom = atomWithMainStorage(
  'defaultLocation',
  '',
  isString,
);

// Sort with/without articles setting
export const ignoreArticlesAtom = atomWithMainStorage(
  'rSortWithArticles',
  true,
  isBoolean,
);

// Only show artists in the list who appear on full albums
export const showArtistsWithFullAlbumsAtom = atomWithMainStorage(
  'FullAlbumsOnly',
  false,
  isBoolean,
);

export const downloadAlbumArtworkAtom = atomWithMainStorage(
  'downloadAlbumArtwork',
  false,
  isBoolean,
);

export const downloadArtistArtworkAtom = atomWithMainStorage(
  'downloadArtistArtwork',
  false,
  isBoolean,
);

export const saveAlbumArtworkWithMusicAtom = atomWithMainStorage(
  'saveAlbumArtworkWithMusic',
  false,
  isBoolean,
);

export const albumCoverNameAtom = atomWithMainStorage(
  'albumCoverName',
  '.CoverArt',
  isString,
);

// The minimum # of songs an artist needs to show up in the artist list
export const minSongCountForArtistListAtom = atomWithMainStorage(
  'MinSongCount',
  1,
  isNumber,
);
