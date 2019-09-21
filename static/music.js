export type Song = {
  URL: string,
  artistIds: Array<number>,
  secondaryIds: Array<number>,
  albumId: number,
  track: number,
  title: string
};

export type Album = {
  year: number,
  primaryArtists: Array<number>,
  title: string,
  vatype: '' | 'ost' | 'va',
  songs: Array<number>
};

export type Artist = {
  name: string,
  songs: Array<number>,
  albums: Array<number>
};

export type MusicDB = {
  songs: Array<Song>,
  albums: Array<Album>,
  albumTitleIndex: Map<string, Array<number>>,
  artists: Array<Artist>,
  artistNameIndex: Map<string, Array<number>>,
  playlists: Array<number> // This is probably a bad idea...
};

const findMusic = async (locations: Array<string>): MusicDB => {
  // TODO: Fill this in correctly
  return {
    songs: [],
    albums: [],
    albumTitleIndex: new Map(),
    artists: [],
    artistNameIndex: new Map(),
    playlists: []
  };
};

module.exports.find = findMusic;
