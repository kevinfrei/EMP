// @flow

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Media from 'react-bootstrap/Media';
import ListGroup from 'react-bootstrap/ListGroup';

import Store from '../MyStore';

import { AddAlbum, AddSong } from '../Playlist';
import { GetArtistForAlbum, GetTrackListingForSong } from '../DataAccess';
import { AlbumByTitle } from '../Sorters';

import type { SongKey, Song, Album, StoreState } from '../MyStore';

import downChevron from '../img/down-chevron.svg';

function getSongList(store: StoreState, songsList: Array<SongKey>) {
  const sl = songsList.map((sk: SongKey) => (
    <div key={sk} onDoubleClick={() => AddSong(store, sk)}>
      {GetTrackListingForSong(store, sk)}
    </div>
  ));
  return <div>{sl}</div>;
}

function SingleAlbum({ album }: { album: Album }) {
  const store = Store.useStore();
  const [showSongs, setShowSongs] = useState(false);
  const artistName = GetArtistForAlbum(store, album);
  const expanderStyle = showSongs ? {} : { transform: 'rotate(-90deg)' };
  const songList = showSongs ? getSongList(store, album.songs) : <></>;
  const adder = () => AddAlbum(store, album.key);
  return (
    <Media>
      <img
        src={`pic://album/${album.key}`}
        height="75px"
        width="75px"
        onDoubleClick={adder}
      />
      <Media.Body>
        <h5 className="album-title" onDoubleClick={adder}>
          {album.title}
        </h5>
        <h6 className="album-year">
          &nbsp;
          <img
            onClick={() => setShowSongs(!showSongs)}
            width="13px"
            height="13px"
            src={downChevron}
            style={expanderStyle}
          />
          &nbsp;
          <span onDoubleClick={adder}>
            {artistName}
            {album.year ? `: ${album.year}` : ''}
          </span>
        </h6>
        {songList}
      </Media.Body>
    </Media>
  );
}

const Albums = () => {
  let store = Store.useStore();
  const albums = store.get('Albums');
  const alb = Array.from(albums.values());
  alb.sort(AlbumByTitle);
  return (
    <div>
      {alb.map((album: Album) => (
        <SingleAlbum key={album.key} album={album} />
      ))}
    </div>
  );
};

export default Albums;
