export type SongKey = string;
export type AlbumKey = string;
export type ArtistKey = string;
export type PlaylistName = string;
export type Playlist = SongKey[];

export type Song = {
  key: SongKey;
  track: number;
  title: string;
  albumId: AlbumKey;
  artistIds: ArtistKey[];
  secondaryIds: ArtistKey[];
};

export type Artist = {
  key: ArtistKey;
  name: string;
  albums: AlbumKey[];
  songs: SongKey[];
};

export type Album = {
  key: AlbumKey;
  year: number;
  title: string;
  vatype: '' | 'va' | 'ost';
  primaryArtists: Set<ArtistKey>;
  songs: SongKey[];
};

export type MediaInfo = {
  general: Map<string, string>;
  audio: Map<string, string>;
};

export type SongData = {
  title: string;
  track: number;
  artist: string;
  album: string;
};

export type AlbumData = { title: string; year: number; artist: string };

export function GetArtistString(
  artistList: ArtistKey[],
  allArtists: Map<ArtistKey, Artist>,
): string | void {
  const artists: string[] = artistList
    .map((ak) => {
      const art: Artist | undefined = allArtists.get(ak);
      return art ? art.name : '';
    })
    .filter((a: string) => a.length > 0);
  if (artists.length === 1) {
    return artists[0];
  } else {
    const lastPart = ' & ' + (artists.pop() || 'OOPS!');
    return artists.join(', ') + lastPart;
  }
}

export function GetDataForSong(
  song: Song,
  allAlbums: Map<AlbumKey, Album>,
  allArtists: Map<ArtistKey, Artist>,
): SongData {
  const res = { title: '-', track: 0, artist: '-', album: '-' };
  if (!song) {
    return res;
  }
  res.title = song.title;
  res.track = song.track;
  const album: Album | undefined = allAlbums.get(song.albumId);
  if (album) {
    res.album = album.title;
  }
  const maybeArtistName = GetArtistString(song.artistIds, allArtists);
  if (!maybeArtistName) {
    return res;
  }
  res.artist = maybeArtistName;
  return res;
}

export function GetArtistForAlbum(
  album: Album,
  artists: Map<ArtistKey, Artist>,
): string {
  if (album.vatype === 'ost') {
    return 'Soundtrack';
  }
  if (album.vatype !== 'va') {
    const maybeArtistName = GetArtistString([...album.primaryArtists], artists);
    if (maybeArtistName) {
      return maybeArtistName;
    }
  }
  return 'Various Artists';
}

export function GetDataForAlbum(
  album: Album,
  artists: Map<ArtistKey, Artist>,
): AlbumData {
  const artist = GetArtistForAlbum(album, artists);
  return { title: album.title, year: album.year, artist };
}
