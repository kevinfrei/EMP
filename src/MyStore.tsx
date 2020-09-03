import type { Effects, Store, StoreDefinition } from 'undux';
import {
  createConnectedStore,
  withReduxDevtools /*, withLogger*/,
} from 'undux';
import effects from './Effects';

export type SongKey = string;
export type AlbumKey = string;
export type ArtistKey = string;

export type Song = {
  key: SongKey;
  track: number;
  title: string;
  URL: string;
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

export type MapNames = 'Artists' | 'Albums' | 'Songs';
export type ArrayOfKeys = 'ArtistArray' | 'AlbumArray' | 'SongArray';
export type ViewNames =
  | 'none'
  | 'recent'
  | 'album'
  | 'artist'
  | 'song'
  | 'playlist'
  | 'current'
  | 'settings';

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

  ArtistListSort: 'AlbumCount' | 'ArtistName' | 'SongCount';
  AlbumListSort: 'AlbumTitle' | 'AlbumYear' | 'ArtistAlbum' | 'ArtistYear';
  SongListSort: 'SongTitle' | 'ArtistAlbum' | 'AlbumTrack';

  MediaInfoCache: Map<SongKey, MediaInfo>;

  // This one should probably NOT be saved in the same format on the server
  Playlists: Map<string, SongKey[]>;
  playlistLocation: string;

  // This is about the actual stuff on screen
  curView: ViewNames; // Which view is selected
  // This is where each view is scrolled to currently
  scrollManager: Map<string, { x: number; y: number }>;

  // The list of songs in the play queue
  songList: SongKey[];

  searchText: string;

  // The current song number being played (or having stopp
  curIndex: number;
  activePlaylistName: string;

  // General state stuff
  playing: boolean; // is a song currently playing?
  shuffle: boolean;
  repeat: boolean; // Have I ever wanted "repeat 1 song"? No. I have not.
  muted: boolean;
  volume: number;
};

const initialState: State = {
  //  locations: [],

  Artists: new Map(),
  Albums: new Map(),
  Songs: new Map(),

  ArtistArray: [],
  AlbumArray: [],
  SongArray: [],

  SortWithArticles: true,

  ArtistListSort: 'ArtistName',
  AlbumListSort: 'ArtistAlbum',
  SongListSort: 'ArtistAlbum',

  MediaInfoCache: new Map(),

  Playlists: new Map(),
  playlistLocation: '',

  curView: 'current',
  scrollManager: new Map(),

  searchText: '',

  songList: [],
  curIndex: -1,
  activePlaylistName: '',

  playing: false,
  shuffle: false,
  repeat: false,
  muted: false,
  volume: 0.8,
};

// This is the white-list of stuff that can be sent from the main process
export const ValidKeyNames = [
  'Artists',
  'Albums',
  'Songs',
  'Playlists',
  'playlistLocation',
  //  'locations',
  'curView',
  'songList',
  'activePlaylistName',
  'curIndex',
  'muted',
  'volume',
];

// I think this is how to combine different effects:
const combinedEffects = (store: StoreDefinition<State>) =>
  effects(withReduxDevtools(store));
export default createConnectedStore<State>(initialState, combinedEffects);

// Docs say: Ignore this if you're using React Hooks
export type StoreProps = {
  store: Store<State>;
};

export type StoreState = Store<State>;
export type StoreEffects = Effects<State>;
