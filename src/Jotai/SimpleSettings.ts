import { StorageId } from '@freik/emp-shared';
import { isArrayOfString, isBoolean, isNumber, isString } from '@freik/typechk';
import { atomWithMainStorage } from './Storage';

export const mutedState = atomWithMainStorage('mute', false, isBoolean);

export const volumeState = atomWithMainStorage('volume', 0.5, isNumber);

// export const repeatState = atomWithMainStorage('repeat', false, isBoolean);

// This is the 'locations' for searching for tunes
export const locationsState = atomWithMainStorage(
  StorageId.Locations,
  [],
  isArrayOfString,
);

export const defaultLocationState = atomWithMainStorage(
  StorageId.DefaultLocation,
  '',
  isString,
);

// Sort with/without articles setting
export const ignoreArticlesState = atomWithMainStorage(
  StorageId.SortWithArticles,
  true,
  isBoolean,
);

// Only show artists in the list who appear on full albums
export const showArtistsWithFullAlbumsState = atomWithMainStorage(
  StorageId.FullAlbumsOnly,
  false,
  isBoolean,
);

export const downloadAlbumArtworkState = atomWithMainStorage(
  StorageId.DownloadAlbumArtwork,
  false,
  isBoolean,
);

export const downloadArtistArtworkState = atomWithMainStorage(
  StorageId.DownloadArtistArtwork,
  false,
  isBoolean,
);

export const saveAlbumArtworkWithMusicState = atomWithMainStorage(
  StorageId.SaveAlbumArtworkWithMusic,
  false,
  isBoolean,
);

export const albumCoverNameState = atomWithMainStorage(
  StorageId.AlbumCoverName,
  '.CoverArt',
  isString,
);

// The minimum # of songs an artist needs to show up in the artist list
export const minSongCountForArtistListState = atomWithMainStorage(
  StorageId.MinSongCount,
  1,
  isNumber,
);
