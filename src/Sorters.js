// @flow

import { Comparisons } from 'my-utils';
import { GetDataForSong } from './DataAccess';

import type { SongKey, StoreState, Album } from './MyStore';

const strCmp = (a: string, b: string): number =>
  a.toLocaleUpperCase().localeCompare(b.toLocaleUpperCase());

export function SongByRLNT(store: StoreState) {
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
    return (
      strCmp(aArtist, bArtist) ||
      strCmp(aAlbum, bAlbum) ||
      aTrack - bTrack ||
      strCmp(aTitle, bTitle)
    );
  };
}

export function SongByLRNT(store: StoreState) {
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
    return (
      strCmp(aAlbum, bAlbum) ||
      strCmp(aArtist, bArtist) ||
      aTrack - bTrack ||
      strCmp(aTitle, bTitle)
    );
  };
}

export function SongByNLRT(store: StoreState) {
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
    return (
      aTrack - bTrack ||
      strCmp(aAlbum, bAlbum) ||
      strCmp(aArtist, bArtist) ||
      strCmp(aTitle, bTitle)
    );
  };
}

export function SongByTLRN(store: StoreState) {
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
    return (
      strCmp(aTitle, bTitle) ||
      strCmp(aAlbum, bAlbum) ||
      strCmp(aArtist, bArtist) ||
      aTrack - bTrack
    );
  };
}

export function AlbumByTitle(a: Album, b: Album) {
  return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
}

export function PlaysetsComp(
  ps1: Map<string, Array<SongKey>>,
  ps2: Map<string, Array<SongKey>>
): boolean {
  if (ps1.size !== ps2.size) {
    return false;
  }
  for (let [k, v] of ps1) {
    const v2 = ps2.get(k);
    if (!Comparisons.ArraySetEqual(v, v2)) {
      return false;
    }
  }
  return true;
}
