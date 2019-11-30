// @flow

import React from 'react';

import AlbumView from './AlbumView';
import ArtistView from './ArtistView';
import MixedSongsView from './MixedSongsView';
import Store from './MyStore';

import type { ViewNames } from './MyStore';

const ViewSelector = () => {
  let store = Store.useStore();
  const which:ViewNames = store.get('curView');
  let res:Element;
  switch (which) {
    case 'album':
      res = <AlbumView />;
      break;
    case 'artist':
      res = <ArtistView />;
      break;
    case 'playlist':
      res =<MixedSongsView />;
      break;
    case 'song':
      res = <MixedSongsView />;
      break;
    case 'none':
    default:
      res = <></>;
  }
  return <div className="current-view">{res}</div>;
};

export default ViewSelector;
