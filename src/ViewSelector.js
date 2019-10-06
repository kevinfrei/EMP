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
  switch (which) {
    case 'album':
      return <AlbumView />;
    case 'artist':
      return <ArtistView />;
    case 'playlist':
      return <MixedSongsView />;
    case 'song':
      return <MixedSongsView />;
    case 'none':
    default:
      return <></>;
  }
};

export default ViewSelector;
