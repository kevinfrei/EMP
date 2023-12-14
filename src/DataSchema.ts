import { Album, AlbumKey, Artist, ArtistKey, Song } from '@freik/media-core';
import { isDefined } from '@freik/typechk';

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

export function GetArtistString(artistList: Artist[]): string {
  if (artistList.length === 1) return artistList[0].name;
  const artists = artistList;
  const lastPart = ' & ' + (artists.pop()?.name || 'OOPS!');
  return artists.map((a) => a.name).join(', ') + lastPart;
}

export function GetArtistStringFromSong(
  sng: Song,
  allArtists: Map<ArtistKey, Artist>,
): string {
  return GetArtistStringFromKeys(sng.artistIds, allArtists);
}

export function GetArtistStringFromKeys(
  artistList: ArtistKey[],
  allArtists: Map<ArtistKey, Artist>,
): string {
  const artists: Artist[] = artistList
    .map((ak) => allArtists.get(ak))
    .filter(isDefined) as Artist[];
  return GetArtistString(artists);
}

//  type DataForSongGetter = (
//   song: Song,
//   allAlbums: Map<AlbumKey, Album>,
//   allArtist: Map<ArtistKey, Artist>,
// ) => SongData;

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
  artistFilter?: (ids: ArtistKey[], lookup: Map<ArtistKey, Artist>) => string,
): SongData {
  const getArtistString = artistFilter || GetArtistStringFromKeys;
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
  res.artist = getArtistString(song.artistIds, allArtists);
  return res;
}

// function GetArtistNameForAlbum(
//   album: Album,
//   artists: Map<ArtistKey, Artist>,
// ): string {
//   if (album.vatype === 'ost') {
//     return 'Soundtrack';
//   }
//   if (album.vatype !== 'va') {
//     const maybeArtistName = GetArtistStringFromKeys(
//       album.primaryArtists,
//       artists,
//     );
//     if (maybeArtistName) {
//       return maybeArtistName;
//     }
//   }
//   return 'Various Artists';
// }

// function GetDataForAlbum(
//   album: Album,
//   artists: Map<ArtistKey, Artist>,
// ): AlbumData {
//   const artist = GetArtistNameForAlbum(album, artists);
//   return { title: album.title, year: album.year, artist };
// }
