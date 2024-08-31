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
  hasFieldType,
  isArrayOfString,
  isNumber,
  isString,
} from '@freik/typechk';
import { SetDB } from './MyWindow';

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

export function MakeMusicLibraryFromFlatAudioDatabase(fad: FlatAudioDatabase) {
  // For debugging, this is helpful sometimes:
  SetDB(fad);
  return {
    songs: new Map(fad.songs.map((swp) => [swp.key, swp])),
    albums: new Map(fad.albums.map((alb) => [alb.key, alb])),
    artists: new Map(fad.artists.map((art) => [art.key, art])),
  };
}
export type SongInfo = {
  song: Song;
  artists: string;
  moreArtists: string;
  album: Album;
};

export function diskNumName(
  songData: SongInfo,
): [string | null, string | null] {
  const diskNo = Math.floor(songData.song.track / 100);
  if (diskNo > 0) {
    if (hasFieldType(songData.album, 'diskNames', isArrayOfString)) {
      return [diskNo.toString(), songData.album.diskNames[diskNo - 1]];
    }
    return [diskNo.toString(), null];
  } else {
    return [null, null];
  }
}

export type MetadataProps = {
  forSong?: SongKey;
  forSongs?: SongKey[];
  artist?: string;
  album?: string;
  track?: string;
  title?: string;
  year?: string;
  va?: string;
  variations?: string;
  moreArtists?: string;
  albumId?: AlbumKey;
  diskName?: string;
};
