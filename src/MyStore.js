// @flow

import type { Effects, Store } from 'undux';
import { createConnectedStore } from 'undux';

export type SongKey = string;
export type AlbumKey = string;
export type ArtistKey = string;

export type Song = {|
  key: SongKey,
  track: number,
  title: string,
  URL: string,
  albumId: AlbumKey,
  artistIds: Array<ArtistKey>,
  secondaryIds: Array<ArtistKey>,
|};

export type Artist = {|
  key: ArtistKey,
  name: string,
  albums: Array<AlbumKey>,
  aongs: Array<SongKey>,
|};

export type Album = {|
  key: AlbumKey,
  year: number,
  title: string,
  vatype: string,
  primaryArtists: Set<ArtistKey>,
  songs: Array<SongKey>,
|};

export type ViewNames =
  | 'none'
  | 'recent'
  | 'album'
  | 'artist'
  | 'song'
  | 'playlist'
  | 'current'
  | 'settings';

export type State = {|
  // This is basically the song database
  // I'm not really confident that this is where it ought to live
  Artists: Map<ArtistKey, Artist>,
  Albums: Map<AlbumKey, Album>,
  Songs: Map<SongKey, Song>,
  Playlists: Map<string, Array<SongKey>>,
  // Just a list of paths to search for music
  locations: Array<string>,
  // This is about the actual stuff on screen
  curView: ViewNames, // Which view is selected
  curSong: string, // the current song key
  playing: boolean, // is a song currently playing?
|};

let initialState: State = {
  Artists: new Map(),
  Albums: new Map(),
  Songs: new Map(),
  Playlists: new Map(),
  locations: [],
  curView: 'none',
  curSong: '',
  playing: false,
};

export const ValidKeyNames = [
  'Artists',
  'Albums',
  'Songs',
  'Playlists',
  'locations',
  'curView',
  'curSong',
  'playing',
];

export default createConnectedStore<State>(initialState);

export const GetDataForSong = (
  store,
  sk: SongKey
): { title: string, artist: string, album: string } => {
  let res = { title: '-', artist: '-', album: '-' };
  const allSongs: ?Map<SongKey, Song> = store.get('Songs');
  if (!allSongs) {
    return res;
  }
  const song: ?Song = allSongs.get(sk);
  if (!song) {
    return res;
  }
  res.title = song.title;
  const allAlbums: ?Map<AlbumKey, Album> = store.get('Albums');
  if (!allAlbums) {
    return res;
  }
  const album: ?Album = allAlbums.get(song.albumId);
  if (album) {
    res.album = album.title;
  }
  const allArtists: ?Map<ArtistKey, Artist> = store.get('Artists');
  if (!allArtists) {
    return res;
  }
  const artists: Array<string> = song.artistIds
    .map((ak) => {
      const art: ?Artist = allArtists.get(ak);
      return art ? art.name : '';
    })
    .filter((a) => a.length > 0);
  let artist = '';
  if (artists.length === 1) {
    artist = artists[0];
  } else {
    artist = ' & ' + artists.pop();
    artist = artists.join(', ') + artist;
  }
  res.artist = artist;
  return res;
};

// Docs say: Ignore this if you're using React Hooks
export type StoreProps = {|
  store: Store<State>,
|};

export type StoreEffects = Effects<State>;
