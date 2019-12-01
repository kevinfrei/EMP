// @flow

import * as React from 'react';

import AlbumsView from './Albums';
import ArtistsView from './Artists';
import MixedSongsView from './MixedSongs';
import RecentlyAddedView from './RecentlyAdded';
import Store from '../MyStore';

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
      res = <MixedSongsView />;
      break;
    case 'song':
      res = <MixedSongsView />;
      break;
    case 'recent':
      res = <RecentlyAddedView />;
      break;
    case 'none':
    default:
      res = <></>;
  }
  return <div className="current-view">{res}</div>;
};

export default ViewSelector;
