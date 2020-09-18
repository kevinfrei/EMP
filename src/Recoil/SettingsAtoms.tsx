import { atom } from 'recoil';

// This is the 'locations' for searching
export const locationsAtom = atom<string[]>({ key: 'locations', default: [] });

export const sortWithArticlesAtom = atom<boolean>({
  key: 'rSortWithArticles',
  default: true,
});

export const albumListSortAtom = atom<string>({
  key: 'rAlbumListSort',
  default: 'ArtistName',
});

export const artistListSortAtom = atom<string>({
  key: 'rArtistListSort',
  default: 'ArtistAlbum',
});

export const songListSortAtom = atom<string>({
  key: 'rSongListSort',
  default: 'ArtistAlbum',
});
