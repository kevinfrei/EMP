import { AlbumKey, SongKey } from '@freik/media-core';

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
