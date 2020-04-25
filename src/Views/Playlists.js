// @flow

// @flow

import React from 'react';

import Store from '../MyStore';

import { StartPlaylist } from '../Playlist';

import './styles/NowPlaying.css';

//import downChevron from '../img/down-chevron.svg';

const Playlists = () => {
  let store = Store.useStore();
  const playlists = store.get('Playlists');
  const curPls = store.get('activePlaylistName');
  const names = [...playlists.keys()];
  names.sort();
  return (
    <div>
      {names.map((name: string) => (
        <div
          className={name === curPls ? 'playing' : 'not-playing'}
          key={`pl@${name}`}
          onDoubleClick={() => StartPlaylist(store, name)}
        >
          {name}: {playlists.get(name).length} songs
        </div>
      ))}
    </div>
  );
};

export default Playlists;
