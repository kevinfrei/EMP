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
  songs: Array<SongKey>,
|};

export type Album = {|
  key: AlbumKey,
  year: number,
  title: string,
  vatype: '' | 'va' | 'ost',
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
  // Just a list of paths to search for music
  locations: Array<string>,

  // This is the song database
  // This should probably not need to be 'complete' but rather rely on
  // the main process for something. I need to measure perf a bit to see
  // if it's a problem, or if it's only UI scaling issues
  Artists: Map<ArtistKey, Artist>,
  Albums: Map<AlbumKey, Album>,
  Songs: Map<SongKey, Song>,

  // This one should probably NOT be saved in the same format on the server
  Playlists: Map<string, Array<SongKey>>,

  // This is about the actual stuff on screen
  curView: ViewNames, // Which view is selected
  // This is where each view is scrolled to currently
  scrollManager: Map<string, { x: number, y: number }>,

  // The list of songs in the play queue
  songList: Array<SongKey>,
  // The current song number being played (or having stopp
  curIndex: number,
  activePlaylistName: string,

  // General state stuff
  playing: boolean, // is a song currently playing?
  shuffle: boolean,
  repeat: boolean, // Have I ever wanted "repeat 1 song"? No. I have not.
|};

let initialState: State = {
  locations: [],

  Artists: new Map(),
  Albums: new Map(),
  Songs: new Map(),

  Playlists: new Map(),

  curView: 'current',
  scrollManager: new Map(),

  songList: [],
  curIndex: -1,
  activePlaylistName: '',

  playing: false,
  shuffle: false,
  repeat: false,
};

// This is the white-list of stuff that can be sent from the main process
export const ValidKeyNames = [
  'Artists',
  'Albums',
  'Songs',
  'Playlists',
  'locations',
  'curView',
  'songList',
  'activePlaylistName',
  'curIndex',
];

export default createConnectedStore<State>(initialState);

// Docs say: Ignore this if you're using React Hooks
export type StoreProps = {|
  store: Store<State>,
|};

export type StoreState = Store<State>;
export type StoreEffects = Effects<State>;
