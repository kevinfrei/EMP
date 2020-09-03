// @flow

import React, { useState, CSSProperties } from 'react';
import Modal from 'react-bootstrap/Modal';

import Store from '../MyStore';

import { AddArtist, AddSong } from '../Playlist';
import { VerticalScrollFixedVirtualList } from '../Scrollables';
import SongLine from '../SongLine';

import type { Properties } from 'csstype';

import './styles/Artists.css';
import downChevron from '../img/down-chevron.svg';

export default function ArtistView() {
  const store = Store.useStore();
  const artists = store.get('Artists');
  const [expandedArtist, setExpandedArtist] = useState('');
  const handleClose = () => setExpandedArtist('');

  function VirtualArtistRow({
    index,
    style,
  }: {
    index: number;
    style: CSSProperties;
  }): JSX.Element {
    const artistArray = store.get('ArtistArray');
    const artist = artists.get(artistArray[index]);
    if (!artist) {
      return <div>{`Error for element ${index}`}</div>;
    }
    return (
      <div
        className="artistContainer"
        style={style}
        onDoubleClick={() => AddArtist(store, artist.key)}
      >
        <div className="artistName">
          {artist.name} &nbsp;
          <img
            onClick={() => setExpandedArtist(artist.key)}
            src={downChevron}
            className="artistChevron"
            alt="expander"
          />
        </div>
        <div className="artistSummary">
          {artist.songs.length} Songs and {artist.albums.length} Albums
        </div>
      </div>
    );
  }

  let details = <></>;
  let dialogHeader = <></>;
  if (!!expandedArtist) {
    const art = artists.get(expandedArtist);
    if (art) {
      dialogHeader = <>{`Song list for ${art.name}`}</>;
      details = (
        <div className="songListForArtist">
          {art.songs.map((k) => (
            <SongLine
              template="L#T"
              key={k}
              className="songForArtist"
              songKey={k}
              onDoubleClick={AddSong}
            />
          ))}
        </div>
      );
    }
  }
  return (
    <div className="artistView">
      <Modal show={!!expandedArtist} onHide={handleClose}>
        <Modal.Dialog>
          <Modal.Header closeButton>
            <Modal.Title>{dialogHeader}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{details}</Modal.Body>
        </Modal.Dialog>
      </Modal>
      <VerticalScrollFixedVirtualList
        scrollId="ArtistsScrollId"
        itemCount={artists.size}
        itemSize={50}
        itemGenerator={VirtualArtistRow}
      />
    </div>
  );
}
