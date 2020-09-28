import { Album, AlbumKey, Artist, ArtistKey, Song } from '@freik/media-utils';

export type SongData = {
  song: Song;
  title: string;
  track: number;
  artist: string;
  album: string;
  year: number; // There are albums with the same name. Ties break by year,
  albumKey: string; // then by key.
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
/**
 * Fill in the 'display' information for a song. Useful for both presenting to
 * the user, and sorting stuff
 *
 * @function
 * @param  {Song} song - the song to get info about
 * @param  {Map<AlbumKey,Album>} allAlbums - the album Map
 * @param  {Map<ArtistKey, Artist>} allArtists - the artist Map
 * @returns SongData - the structure necessary to sort and/or display stuff
 */
export function GetDataForSong(
  song: Song,
  allAlbums: Map<AlbumKey, Album>,
  allArtists: Map<ArtistKey, Artist>,
): SongData {
  const res = {
    song,
    title: '-',
    track: 0,
    artist: '-',
    album: '-',
    albumKey: song.albumId,
    year: 0,
  };
  if (!song) {
    return res;
  }
  res.title = song.title;
  res.track = song.track;
  const album: Album | undefined = allAlbums.get(song.albumId);
  if (album) {
    res.album = album.title;
    res.year = album.year;
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
