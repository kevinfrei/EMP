// @flow
import type { StoreEffects } from './MyStore';
import { SortSongs, SortAlbums, SortArtists } from './Sorters';

const effects: StoreEffects = (store) => {
  // We need to combine this stuff to get the sorted lists correctly.
  store.on('SortWithArticles').subscribe((v) => {
    SortSongs(store);
    SortAlbums(store);
    SortArtists(store);
  });
  store.on('Songs').subscribe((v) => {
    SortSongs(store);
  });
  store.on('SongListSort').subscribe((v) => {
    SortSongs(store);
  });
  store.on('Albums').subscribe((v) => {
    SortAlbums(store);
  });
  store.on('AlbumListSort').subscribe((v) => {
    SortAlbums(store);
  });
  store.on('Artists').subscribe((v) => {
    SortArtists(store);
  });
  store.on('ArtistListSort').subscribe((v) => {
    SortArtists(store);
  });
  return store;
};

export default effects;
