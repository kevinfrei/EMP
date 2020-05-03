// @flow

import React, { useState } from 'react';
import { FixedSizeList } from 'react-window';
import Media from 'react-bootstrap/Media';
import ListGroup from 'react-bootstrap/ListGroup';
import ListGroupItem from 'react-bootstrap/ListGroupItem';

import Store from '../MyStore';

import { AddAlbum, AddSong } from '../Playlist';
import { GetArtistForAlbum, GetTrackListingForSong } from '../DataAccess';

import type { SongKey, Album, StoreState } from '../MyStore';
import type { Properties } from 'csstype';

import downChevron from '../img/down-chevron.svg';

function getSongList(store: StoreState, songsList: Array<SongKey>) {
  const sl = songsList.map((sk: SongKey) => (
    <ListGroupItem key={sk} onDoubleClick={() => AddSong(store, sk)}>
      {GetTrackListingForSong(store, sk)}
    </ListGroupItem>
  ));
  return <ListGroup>{sl}</ListGroup>;
}

function SingleAlbum({
  album,
  style,
}: {
  album: Album,
  style: Properties<>,
}) {
  const store = Store.useStore();
  const artistName = GetArtistForAlbum(store, album);
  const adder = () => AddAlbum(store, album.key);
  /*
  const [showSongs, setShowSongs] = useState(false);
  const expanderStyle = showSongs ? {} : { transform: 'rotate(-90deg)' };
    const songList = showSongs ? getSongList(store, album.songs) : <></>;

            &nbsp;
            <img
              onClick={() => setShowSongs(!showSongs)}
              width="13px"
              height="13px"
              src={downChevron}
              style={expanderStyle}
              alt="show shows"
            />...
            {songList}
*/
  return (
    <ListGroupItem style={style}>
      <Media>
        <img
          src={`pic://album/${album.key}`}
          height="55px"
          width="55px"
          onDoubleClick={adder}
          alt="album cover"
        />
        <Media.Body>
          <h5 className="album-title" onDoubleClick={adder}>
            {album.title}
          </h5>
          <h6 className="album-year">
            &nbsp;
            <span onDoubleClick={adder}>
              {artistName}
              {album.year ? `: ${album.year}` : ''}
            </span>
          </h6>
        </Media.Body>
      </Media>
    </ListGroupItem>
  );
}

function VirtualAlbumRow({
  index,
  style,
}: {
  index: number,
  style: Properties<>,
}) {
  const store = Store.useStore();
  const albums = store.get('Albums');
  const albumArray = store.get('AlbumArray');
  const maybeAlbum = albums.get(albumArray[index]);
  return maybeAlbum ? (
    <SingleAlbum style={style} album={maybeAlbum} />
  ) : (
    <div>Error for element {index}</div>
  );
}

const VirtualAlbumView = {
  name: 'Albums',
  height: 80,
  rowCreator: VirtualAlbumRow,
};

export default VirtualAlbumView;
