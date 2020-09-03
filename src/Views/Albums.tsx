// @flow

import React, { useState, CSSProperties } from 'react';
import Modal from 'react-bootstrap/Modal';

import Store from '../MyStore';

import { AddAlbum, AddSong } from '../Playlist';
import { GetArtistForAlbum } from '../DataAccess';
import { VerticalScrollFixedVirtualList } from '../Scrollables';
import SongLine from '../SongLine';

import type { Album } from '../MyStore';
import type { Properties } from 'csstype';

import './styles/Albums.css';
import downChevron from '../img/down-chevron.svg';

export default function AlbumView() {
  const store = Store.useStore();
  const albums = store.get('Albums');
  const albumArray = store.get('AlbumArray');
  const [expandedAlbum, setExpandedAlbum] = useState('');
  const handleClose = () => setExpandedAlbum('');
  let details = <></>;
  let dialogHeader = '';

  if (!!expandedAlbum) {
    const album = albums.get(expandedAlbum);
    if (album) {
      const artistName = GetArtistForAlbum(store, album);
      details = (
        <div className="songListForAlbum">
          {album.songs.map((k) => (
            <SongLine
              template="R#T"
              key={k}
              songKey={k}
              className="songForAlbum"
              onDoubleClick={AddSong}
            />
          ))}
        </div>
      );
      dialogHeader = album.title + ' ' + artistName;
    }
  }

  const SingleAlbum = ({
    album,
    style,
  }: {
    album: Album;
    style: CSSProperties;
  }) => {
    const artistName = GetArtistForAlbum(store, album);
    const adder = () => AddAlbum(store, album.key);

    return (
      <div style={style} className="albumContainer">
        <img
          src={`pic://album/${album.key}`}
          onDoubleClick={() => AddAlbum(store, album.key)}
          alt="album cover"
          className="albumCover"
        />
        <span>
          <div className="albumTitle" onDoubleClick={adder}>
            {album.title}
          </div>
          <div className="albumDetails">
            &nbsp;
            <span onDoubleClick={adder}>
              {artistName}
              {album.year ? `: ${album.year}` : ''} &nbsp;
              <img
                onClick={() => setExpandedAlbum(album.key)}
                src={downChevron}
                className="albumChevron"
                alt="expander"
              />
            </span>
          </div>
        </span>
      </div>
    );
  };

  const VirtualAlbumRow = ({index, style}:{
    index: number,
    style: CSSProperties,
  }): JSX.Element => {
    const maybeAlbum = albums.get(albumArray[index]);
    if (maybeAlbum) {
      return <SingleAlbum key={index} style={style} album={maybeAlbum} />;
    } else {
      return <div>Error for element {index}</div>;
    }
  };
  return (
    <div className="albumView">
      <Modal show={!!expandedAlbum} onHide={handleClose}>
        <Modal.Dialog>
          <Modal.Header closeButton>
            <Modal.Title>{dialogHeader}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{details}</Modal.Body>
        </Modal.Dialog>
      </Modal>
      <VerticalScrollFixedVirtualList
        scrollId="AlbumsScrollPos"
        itemCount={albums.size}
        itemSize={70}
        itemGenerator={VirtualAlbumRow}
      />
    </div>
  );
}
