// @flow

import { GetDataForSong } from './DataAccess';

import type { SongKey, StoreState, Album } from './MyStore';

export function SongByRLTN(store: StoreState) {
  return (a: SongKey, b: SongKey) => {
    const {
      title: aTitle,
      track: aTrack,
      album: aAlbum,
      artist: aArtist,
    } = GetDataForSong(store, a);
    const {
      title: bTitle,
      track: bTrack,
      album: bAlbum,
      artist: bArtist,
    } = GetDataForSong(store, b);
    let res = aArtist
      .toLocaleLowerCase()
      .localeCompare(bArtist.toLocaleLowerCase());
    if (res !== 0) {
      return res;
    }
    res = aAlbum.toLocaleLowerCase().localeCompare(bAlbum.toLocaleLowerCase());
    if (res !== 0) {
      return res;
    }
    if (aTrack !== bTrack) {
      return aTrack - bTrack;
    }
    return aTitle.toLocaleLowerCase().localeCompare(bTitle.toLocaleLowerCase());
  };
}

export function AlbumByTitle(a: Album, b: Album) {
  return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
}
