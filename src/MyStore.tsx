/* eslint-disable @typescript-eslint/naming-convention */

import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from './DataSchema';

export type MapNames = 'Artists' | 'Albums' | 'Songs';
export type ArrayOfKeys = 'ArtistArray' | 'AlbumArray' | 'SongArray';

export type State = {
  // Just a list of paths to search for music
  // locations: string[],

  // This is the song database
  // This should probably not need to be 'complete' but rather rely on
  // the main process for something. I need to measure perf a bit to see
  // if it's a problem, or if it's only UI scaling issues
  Artists: Map<ArtistKey, Artist>;
  Albums: Map<AlbumKey, Album>;
  Songs: Map<SongKey, Song>;

  ArtistArray: ArtistKey[];
  AlbumArray: AlbumKey[];
  SongArray: SongKey[];

  SortWithArticles: boolean;

  // This one should probably NOT be saved in the same format on the server
  Playlists: Map<string, SongKey[]>;

  // This is where each view is scrolled to currently
  scrollManager: Map<string, { x: number; y: number }>;

  // The list of songs in the play queue
  songList: SongKey[];

  // The current song number being played (or having stopp
  curIndex: number;
  activePlaylistName: string;
};
