// @flow

import type { Effects, Store } from 'undux';
import { createConnectedStore } from 'undux';

export type Song = {|
  Track: number,
  Name: string,
  Artist: number,
  Album: number
|};

export type State = {|
  foo: number,
  bar: string,
  Artists: Map<number, string>,
  Albums: Map<number, string>,
  Songs: Map<number, Song>,
  Playlists: Map<string, Array<number>>
|};

let initialState: State = {
  foo: -50,
  bar: '---',
  Artists: new Map(),
  Albums: new Map(),
  Songs: new Map(),
  Playlists: new Map()
};

export default createConnectedStore<State>(initialState);

// Ignore this if you're using React Hooks
/*export type StoreProps = {|
  store: Store<State>
|};*/

export type StoreEffects = Effects<State>;
