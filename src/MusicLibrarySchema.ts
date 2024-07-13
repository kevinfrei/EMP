import { FlatAudioDatabase } from '@freik/audiodb';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-core';
import {
  chkArrayOf,
  chkObjectOfType,
  isArrayOfString,
  isNumber,
  isString,
} from '@freik/typechk';

export type SongMap = Map<SongKey, Song>;
export type AlbumMap = Map<AlbumKey, Album>;
export type ArtistMap = Map<ArtistKey, Artist>;
export type MusicLibrary = {
  songs: SongMap;
  albums: AlbumMap;
  artists: ArtistMap;
};
export type AlbumDescription = {
  artist: string;
  album: string;
  year: string;
};
export type AlbumDescriptionWithKey = {
  key: AlbumKey;
} & AlbumDescription;
export type SongDescription = {
  title: string;
  track: number;
} & AlbumDescription;

const isSong = chkObjectOfType<Song & { path?: string }>(
  {
    key: isString,
    track: isNumber,
    title: isString,
    albumId: isString,
    artistIds: isArrayOfString,
    secondaryIds: isArrayOfString,
  },
  { path: isString, variations: isArrayOfString },
);

const isAlbum = chkObjectOfType<Album>(
  {
    key: isString,
    year: isNumber,
    title: isString,
    primaryArtists: isArrayOfString,
    songs: isArrayOfString,
    vatype: (o: unknown) => o === '' || o === 'ost' || o === 'va',
  },
  {
    diskNames: isArrayOfString,
  },
);

const isArtist = chkObjectOfType<Artist>({
  key: isString,
  name: isString,
  albums: isArrayOfString,
  songs: isArrayOfString,
});

export const isFlatAudioDatabase = chkObjectOfType<FlatAudioDatabase>({
  songs: chkArrayOf(isSong),
  albums: chkArrayOf(isAlbum),
  artists: chkArrayOf(isArtist),
});

export const emptyLibrary = {
  songs: new Map<SongKey, Song>(),
  albums: new Map<AlbumKey, Album>(),
  artists: new Map<ArtistKey, Artist>(),
};
