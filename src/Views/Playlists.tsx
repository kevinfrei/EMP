import React, { useState, CSSProperties } from 'react';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import Store from '../MyStore';

import { StartPlaylist, DeletePlaylist } from '../Playlist';
import SongLine from '../SongLine';
import { VerticalScrollDiv } from '../Scrollables';

import type { SongKey } from '../MyStore';
import type { Properties } from 'csstype';

import './styles/Playlists.css';
import downChevron from '../img/down-chevron.svg';
import deletePic from '../img/delete.svg';

function Playlist({ name, playing }: { name: string; playing: boolean }) {
  const store = Store.useStore();
  const [showSongs, setShowSongs] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const playlists = store.get('Playlists');
  const thisPlaylist = playlists.get(name);

  const closeConfirmation = () => setShowConfirmation(false);
  const approvedConfirmation = () => {
    DeletePlaylist(store, name);
    closeConfirmation();
  };
  if (!thisPlaylist) {
    return <></>;
  }
  const expanderStyle: CSSProperties = showSongs
    ? {}
    : { transform: 'rotate(-90deg)' };
  const theSongs = !showSongs ? (
    <></>
  ) : (
    <div className="expandedSongList">
      {thisPlaylist.map((sk: SongKey) => (
        <SongLine key={sk} songKey={sk} template="LCRCT">
          <span>&nbsp;-&nbsp;</span>
        </SongLine>
      ))}
    </div>
  );

  return (
    <Card
      className={playing ? 'playing' : 'not-playing'}
      onDoubleClick={() => StartPlaylist(store, name)}
    >
      <Modal show={showConfirmation} onHide={closeConfirmation}>
        <Modal.Header closeButton>
          <Modal.Title>Please Confirm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the playlist "{name}"?
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={approvedConfirmation}>Yes</Button>
          <Button onClick={closeConfirmation}>No</Button>
        </Modal.Footer>
      </Modal>
      <Card.Body>
        <Card.Title>
          <span>{name}</span>
          <img
            className="pic-button delete-playlist"
            src={deletePic}
            alt="Remove"
            onClick={() => setShowConfirmation(true)}
          ></img>
        </Card.Title>
        <Card.Text>
          {' '}
          &nbsp;
          <img
            onClick={() => setShowSongs(!showSongs)}
            width="13px"
            height="13px"
            src={downChevron}
            style={expanderStyle}
            alt="show shows"
          />
          &nbsp;
          {thisPlaylist.length} songs
        </Card.Text>
      </Card.Body>
      {theSongs}
    </Card>
  );
}

export default function Playlists() {
  const store = Store.useStore();
  const playlists = store.get('Playlists');
  const curPls = store.get('activePlaylistName');
  const names = [...playlists.keys()];
  names.sort();
  return (
    <>
      <div id="current-header">Playlists</div>
      <div id="current-view" />
      <VerticalScrollDiv scrollId="playlistsPos" layoutId="current-view">
        {names.map((name: string) => (
          <Playlist
            /*            store={store}*/
            key={name}
            name={name}
            playing={name === curPls}
          />
        ))}
      </VerticalScrollDiv>
    </>
  );
}
