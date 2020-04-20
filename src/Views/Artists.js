// @flow

import React from 'react';
import Card from 'react-bootstrap/Card';

import Store from '../MyStore';

import { AddArtist } from '../Playlist';

import type { Artist } from '../MyStore';

const SingleArtist = ({ artist }: { artist: Artist }) => {
  const store = Store.useStore();
  return (
    <Card onDoubleClick={() => AddArtist(store, artist.key)}>
      <Card.Body>
        <Card.Title>{artist.name}</Card.Title>
        <Card.Subtitle>
          {artist.songs.length} Songs and {artist.albums.length} Albums
        </Card.Subtitle>
      </Card.Body>
    </Card>
  );
};
const Artists = () => {
  let store = Store.useStore();
  const artists = store.get('Artists');
  const arr = Array.from(artists.values());
  arr.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  return (
    <div>
      {arr.map((artist) => (
        <SingleArtist key={artist.key} artist={artist} />
      ))}
    </div>
  );
};
export default Artists;
