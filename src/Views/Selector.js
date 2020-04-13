// @flow

import * as React from 'react';

import AlbumsView from './Albums';
import ArtistsView from './Artists';
import MixedSongsView from './MixedSongs';
import RecentlyAddedView from './RecentlyAdded';
import NowPlayingView from './NowPlaying';
import SettingsView from './Settings';
import PlaylistsView from './Playlists';
import Store from '../MyStore';

import './styles/Selector.css';

import type { ViewNames } from '../MyStore';

const ViewSelector = () => {
  let store = Store.useStore();
  const which: ViewNames = store.get('curView');
  let res: React.Node;
  switch (which) {
    case 'album':
      res = <AlbumsView />;
      break;
    case 'artist':
      res = <ArtistsView />;
      break;
    case 'playlist':
      res = <PlaylistsView />;
      break;
    case 'song':
      res = <MixedSongsView />;
      break;
    case 'recent':
      res = <RecentlyAddedView />;
      break;
    case 'current':
      res = <NowPlayingView />;
      break;
    case 'settings':
      res = <SettingsView />;
      break;
    case 'none':
    default:
      res = <></>;
  }
  return <div className="current-view">{res}</div>;
};

export default ViewSelector;
