// @flow

import React from 'react';
import Card from 'react-bootstrap/Card';

import Store from '../MyStore';

import { AddArtist } from '../Playlist';

function VirtualArtistRow({ index, style }: { index: number, style: Object }) {
  const store = Store.useStore();
  const artists = store.get('Artists');
  const artistArray = store.get('ArtistArray');
  const artist = artists.get(artistArray[index]);
  if (!artist) {
    return <div>Error for element {index}</div>;
  }
  return (
    <Card style={style} onDoubleClick={() => AddArtist(store, artist.key)}>
      <Card.Body>
        <Card.Title>{artist.name}</Card.Title>
        <Card.Subtitle>
          {artist.songs.length} Songs and {artist.albums.length} Albums
        </Card.Subtitle>
      </Card.Body>
    </Card>
  );
}

const VirtualArtistView = {
  name: 'Artists',
  height: 80,
  rowCreator: VirtualArtistRow,
};

export default VirtualArtistView;
