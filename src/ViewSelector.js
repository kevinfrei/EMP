// @flow

import React from 'react';

import AlbumView from './AlbumView';
import ArtistView from './ArtistView';
import MixedSongsView from './MixedSongsView';

const ViewSelector = () => (
  <>
    <div>Please pick a view</div>
    <AlbumView />
    <ArtistView />
    <MixedSongsView />
  </>
);

export default ViewSelector;
