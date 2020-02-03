// @flow

import React from 'react';
import Store from '../MyStore';

import type { ViewNames } from '../MyStore';

const SingleArtist = ({ artist }) => <div>{artist.name}</div>;

const Artists = () => {
  let store = Store.useStore();
  const artists = store.get('Artists');
  const arr = Array.from(artists.values());
  arr.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  return (
    <div>
      {arr.map(artist => (
        <SingleArtist key={artist.key} artist={artist} />
      ))}
    </div>
  );
};
export default Artists;
