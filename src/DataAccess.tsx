import type {
  StoreState,
  SongKey,
  AlbumKey,
  ArtistKey,
  Song,
  Album,
  Artist,
} from './MyStore';

export type AlbumInfo = { title: string; year: number; artist: string };

export function GetArtistString(
  store: StoreState,
  artistList: ArtistKey[],
): string | void {
  const allArtists: Map<ArtistKey, Artist> | undefined = store.get('Artists');
  if (!allArtists) {
    return;
  }
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
export function GetSong(store: StoreState, sk: SongKey): Song | void {
  const allSongs: Map<SongKey, Song> | undefined = store.get('Songs');
  if (allSongs) {
    return allSongs.get(sk);
  }
}

export function GetTrackListingForSong(store: StoreState, sk: SongKey): string {
  const song: Song | void = GetSong(store, sk);
  if (!song) {
    return '# - No Name';
  }
  return `${song.track} - ${song.title}`;
}

export function GetDataForSong(
  store: StoreState,
  sk: SongKey,
): { title: string; track: number; artist: string; album: string } {
  const res = { title: '-', track: 0, artist: '-', album: '-' };
  const song: Song | void = GetSong(store, sk);
  if (!song) {
    return res;
  }
  res.title = song.title;
  res.track = song.track;
  const allAlbums: Map<AlbumKey, Album> | undefined = store.get('Albums');
  if (!allAlbums) {
    return res;
  }
  const album: Album | undefined = allAlbums.get(song.albumId);
  if (album) {
    res.album = album.title;
  }
  const maybeArtistName = GetArtistString(store, song.artistIds);
  if (!maybeArtistName) {
    return res;
  }
  res.artist = maybeArtistName;
  return res;
}

export function GetArtistForAlbum(
  store: StoreState,
  album: Album | AlbumKey,
): string {
  let alb = album;
  if (typeof album === 'string') {
    const albums = store.get('Albums');
    const alOrNull = albums.get(album);
    if (!!alOrNull) {
      return 'UNDEFINED';
    }
    alb = alOrNull!;
  }
  const lb: Album = alb as Album;
  if (lb.vatype === 'ost') {
    return 'Soundtrack';
  }
  if (lb.vatype !== 'va') {
    const maybeArtistName = GetArtistString(store, [...lb.primaryArtists]);
    if (maybeArtistName) {
      return maybeArtistName;
    }
  }
  return 'Various Artists';
}

export function GetDataForAlbum(
  store: StoreState,
  albumKey: AlbumKey,
): AlbumInfo {
  const album = store.get('Albums').get(albumKey);
  if (!album) {
    return { title: 'UNDEFINED', year: 0, artist: 'UNDEFINED' };
  }
  const artist = GetArtistForAlbum(store, album);
  return { title: album.title, year: album.year, artist };
}
