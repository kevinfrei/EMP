// @flow

import type { Effects, Store } from 'undux';
import { createConnectedStore } from 'undux';

export type SongKey = string;
export type AlbumKey = string;
export type ArtistKey = string;

export type Song = {|
  Track: number,
  Name: string,
  Artist: number,
  Album: number,
  key: SongKey
|};

export type Artist = {|
  Name: string,
  Albums: Array<AlbumKey>,
  Songs: Array<SongKey>,
  key: ArtistKey
|};

export type Album = {|
  Name: string,
  Year: number,
  PrimaryArtist: ArtistKey,
  Songs: Array<SongKey>,
  key: AlbumKey
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
  curSong: string // the current song key
|};

let initialState: State = {
  Artists: new Map(),
  Albums: new Map(),
  Songs: new Map(),
  Playlists: new Map(),
  locations: [],
  curView: 'none',
  curSong: ''
};

export const ValidKeyNames = [
  'Artists',
  'Albums',
  'Songs',
  'Playlists',
  'locations',
  'curView',
  'curSong'
];
export default createConnectedStore<State>(initialState);

// Docs say: Ignore this if you're using React Hooks
export type StoreProps = {|
  store: Store<State>
|};

export type StoreEffects = Effects<State>;
