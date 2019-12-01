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

export type ViewNames = 'none' | 'recent' | 'album' | 'artist' | 'song' | 'playlist';

export type State = {|
  // Silliness for now:
  foo: number,
  bar: string,
  // Real state stuff:
  request: string, // 'none', 'sent', or the message to send to main
  // This is basically the song database
  // I'm not really confident that this is where it ought to live
  Artists: Map<ArtistKey, Artist>,
  Albums: Map<AlbumKey, Album>,
  Songs: Map<SongKey, Song>,
  Playlists: Map<string, Array<SongKey>>,
  // This is about the actual stuff on screen
  curView: ViewNames // Which view is selected
|};

let initialState: State = {
  foo: -50,
  bar: '---',
  request:'none',
  Artists: new Map(),
  Albums: new Map(),
  Songs: new Map(),
  Playlists: new Map(),
  curView: 'none'
};

export default createConnectedStore<State>(initialState);

// Docs say: Ignore this if you're using React Hooks
export type StoreProps = {|
  store: Store<State>
|};

export type StoreEffects = Effects<State>;
