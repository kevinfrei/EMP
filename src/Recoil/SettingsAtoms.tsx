import { makeBackedAtom } from './Atoms';

// This is the 'locations' for searching
export const SyncedLocations = makeBackedAtom<string[]>('locations', []);

export const SortWithArticles = makeBackedAtom<boolean>(
  'rSortWithArticles',
  true,
);

export const AlbumListSort = makeBackedAtom<string>(
  'rAlbumListSort',
  'ArtistName',
);

export const ArtistListSort = makeBackedAtom<string>(
  'rArtistListSort',
  'ArtistAlbum',
);

export const SongListSort = makeBackedAtom<string>(
  'rSongListSort',
  'ArtistAlbum',
);
