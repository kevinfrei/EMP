import { makeBackedAtom } from './Atoms';

// This is the 'locations' for searching
export const syncedLocations = makeBackedAtom<string[]>('locations', []);

export const sortWithArticles = makeBackedAtom<boolean>(
  'rSortWithArticles',
  true,
);

export const albumListSort = makeBackedAtom<string>(
  'rAlbumListSort',
  'ArtistName',
);

export const artistListSort = makeBackedAtom<string>(
  'rArtistListSort',
  'ArtistAlbum',
);

export const songListSort = makeBackedAtom<string>(
  'rSongListSort',
  'ArtistAlbum',
);
