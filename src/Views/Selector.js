// @flow

import React from 'react';

import Store from '../MyStore';

import AlbumView from './Albums';
import ArtistView from './Artists';
import MixedSongView from './MixedSongs';
import PlaylistsView from './Playlists';
import NowPlayingView from './NowPlaying';
import SettingsView from './Settings';
//import RecentlyAddedView from './RecentlyAdded';

export default function ViewSelector() {
  let store = Store.useStore();
  const which = store.get('curView');
  switch (which) {
    case 'album':
      return <AlbumView />;
    case 'artist':
      return <ArtistView />;
    case 'playlist':
      return <PlaylistsView />;
    /*
    case 'recent':
      return <RecentlyAddedView />;
    */
    case 'current':
      return <NowPlayingView />;
    case 'settings':
      return <SettingsView />;
    case 'song':
      return <MixedSongView />;
    default:
      return <></>;
  }
}
