import { atom } from 'recoil';

// This is the 'locations' for searching
export const locationsAtom = atom<string[]>({ key: 'locations', default: [] });

export const sortWithArticlesAtom = atom<boolean>({
  key: 'rSortWithArticles',
  default: true,
});

// For these things:
// n= Track #, r= Artist, l= Album, t= Title, y= Year
// Capital = descending, lowercase = ascending
// For album & artist sorting, q= total # (Quantity!) of tracks
// For artist sorting, s= # of Songs

export const albumListSortAtom = atom<string>({
  key: 'rAlbumListSort',
  default: 'ry',
});

export const artistListSortAtom = atom<string>({
  key: 'rArtistListSort',
  default: 'rl',
});

export const songListSortAtom = atom<string>({
  key: 'rSongListSort',
  default: 'rl',
});
