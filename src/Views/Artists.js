// @flow

import React from 'react';
import Card from 'react-bootstrap/Card';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import Store from '../MyStore';

import { AddArtist } from '../Playlist';

import type { StoreState } from '../MyStore';
import type { Properties } from 'csstype';

function VirtualArtistRow({
  index,
  style,
}: {
  index: number,
  style: Properties<>,
}) {
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

export default function ArtistView() {
  const store = Store.useStore();
  const artists = store.get('Artists');
  const customView = ({ height, width }) => {
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
  };
  return <AutoSizer>{customView}</AutoSizer>;
}
