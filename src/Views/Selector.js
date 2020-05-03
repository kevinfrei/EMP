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

  let res;
  switch (which) {
    case 'album':
      res = <AlbumView />;
      break;
    case 'artist':
      res = <ArtistView />;
      break;
    case 'playlist':
      res = <PlaylistsView />;
      break;
/*    case 'recent':
      res = <RecentlyAddedView />;
      break;*/
    case 'current':
      res = <NowPlayingView />;
      break;
    case 'settings':
      res = <SettingsView />;
      break;
    case 'song':
      res = <MixedSongView />;
      break;
    default:
      return <></>;
  }

  return <div className="current-view">{res}</div>;
}
