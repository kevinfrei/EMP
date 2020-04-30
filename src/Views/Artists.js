// @flow

import React from 'react';
import { FixedSizeList } from 'react-window';
import Card from 'react-bootstrap/Card';

import Store from '../MyStore';

import { AddArtist } from '../Playlist';

import type { Artist } from '../MyStore';

function VirtualArtistRow({ index, style }: { index: number, style: object }) {
  const store = Store.useStore();
  const artists = store.get('Artists');
  const artistArray = store.get('ArtistArray');
  const artist = artists.get(artistArray[index]);
  if (!artist) {
    return <span>Error for element {index}</span>;
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

export default function ArtistViewCreator(
  store: StoreState,
  width: number,
  height: number
) {
  const artists = store.get('Artists');
  return (
    <FixedSizeList
      height={height}
      width={width}
      itemCount={artists.size}
      itemSize={80}
    >
      {VirtualArtistRow}
    </FixedSizeList>
  );
}
