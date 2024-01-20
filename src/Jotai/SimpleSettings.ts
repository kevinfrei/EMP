import { StorageKey } from '@freik/emp-shared';
import { isArrayOfString, isBoolean, isNumber, isString } from '@freik/typechk';
import { atomWithMainStorage } from './Helpers';

export const mutedAtom = atomWithMainStorage(StorageKey.Mute, false, isBoolean);

export const volumeAtom = atomWithMainStorage(StorageKey.Volume, 0.5, isNumber);

export const repeatAtom = atomWithMainStorage(
  StorageKey.Repeat,
  false,
  isBoolean,
);

export const shuffleAtom = atomWithMainStorage(
  StorageKey.Shuffle,
  false,
  isBoolean,
);

// This is the 'locations' for searching for tunes
export const locationsAtom = atomWithMainStorage(
  StorageKey.Locations,
  [],
  isArrayOfString,
);

export const defaultLocationAtom = atomWithMainStorage(
  StorageKey.DefaultLocation,
  '',
  isString,
);

// Sort with/without articles setting
export const ignoreArticlesAtom = atomWithMainStorage(
  StorageKey.SortWithArticles,
  true,
  isBoolean,
);

// Only show artists in the list who appear on full albums
export const showArtistsWithFullAlbumsAtom = atomWithMainStorage(
  StorageKey.FullAlbumsOnly,
  false,
  isBoolean,
);

export const downloadAlbumArtworkAtom = atomWithMainStorage(
  StorageKey.DownloadAlbumArtwork,
  false,
  isBoolean,
);

export const downloadArtistArtworkAtom = atomWithMainStorage(
  StorageKey.DownloadArtistArtwork,
  false,
  isBoolean,
);

export const saveAlbumArtworkWithMusicAtom = atomWithMainStorage(
  StorageKey.SaveAlbumArtworkWithMusic,
  false,
  isBoolean,
);

export const albumCoverNameAtom = atomWithMainStorage(
  StorageKey.AlbumCoverName,
  '.CoverArt',
  isString,
);

// The minimum # of songs an artist needs to show up in the artist list
export const minSongCountForArtistListAtom = atomWithMainStorage(
  StorageKey.MinSongCount,
  1,
  isNumber,
);
