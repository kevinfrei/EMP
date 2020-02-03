// @flow

import React from 'react';
import Store from '../MyStore';

const SingleAlbum = ({ album }) => (
  <div>
    <span>{album.title}</span>
    {':'}
    <span>{album.year}</span>
  </div>
);

const Albums = () => {
  let store = Store.useStore();
  const albums = store.get('Albums');
  const alb = Array.from(albums.values());
  alb.sort((a, b) =>
    a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  );
  return (
    <div>
      {alb.map(album => (
        <SingleAlbum key={album.key} album={album} />
      ))}
    </div>
  );
};

export default Albums;
