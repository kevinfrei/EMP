// @flow

import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import FormControl from 'react-bootstrap/FormControl';
import { Comparisons } from 'my-utils';

import Store from '../MyStore';

import { GetDataForSong } from '../DataAccess';
import {
  PlayingPlaylist,
  PlaySongNumber,
  StopAndClear,
  RemoveSongNumber,
} from '../Playlist';

import './styles/NowPlaying.css';
import deletePic from '../img/delete.svg';

const NowPlaying = () => {
  const store = Store.useStore();

  const nowPlaying: string = store.get('activePlaylistName');
  const setNowPlaying = store.set('activePlaylistName');
  const curPls = store.get('Playlists');
  const setCurPls = store.set('Playlists');
  const songList = store.get('songList');
  const curIndex = store.get('curIndex');

  const [show, setShow] = useState(false);
  const [inputName, setInputName] = useState(nowPlaying);

  const justClose = () => setShow(false);
  const showSaveDialog = () => setShow(true);

  const saveAndClose = () => {
    if (curPls.get(inputName)) {
      window.alert('Cowardly refusing to overwrite existing playlist.');
    } else {
      curPls.set(inputName, [...songList]);
      setCurPls(curPls);
      setNowPlaying(inputName);
    }
    justClose();
  };

  const modalDialogs = (
    <Modal show={show} onHide={justClose}>
      <Modal.Header closeButton>
        <Modal.Title>Save Playlist as...</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FormControl
          type="input"
          placeholder="Playlist name"
          value={inputName}
          onChange={(ev) => setInputName(ev.target.value)}
        ></FormControl>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={justClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={saveAndClose}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );

  let header;
  let button;
  const save = () => {
    curPls.set(nowPlaying, [...songList]);
    setCurPls(curPls);
  };
  const del = () => StopAndClear(store);
  if (PlayingPlaylist(nowPlaying)) {
    header = nowPlaying;
    // Only use this button if it's been modified?
    const curPlList = curPls.get(nowPlaying);
    const disabled =
      !curPlList || !Comparisons.ArraySetEqual(songList, curPlList);
    button = (
      <Button size="sm" onClick={save} id="save-playlist" disabled={disabled}>
        Save
      </Button>
    );
  } else {
    header = 'Now Playing';
    button = <></>;
  }
  const headerLine = (
    <h4 id="now-playing-header">
      {header}&nbsp;
      <img
        className="delete-pic pic-button"
        src={deletePic}
        alt="Remove"
        onClick={del}
      />
      <Button size="sm" id="save-playlist-as" onClick={showSaveDialog}>
        Save As...
      </Button>
      {button}
    </h4>
  );

  const songs = songList.map((val, idx) => {
    const songKey = songList[idx];
    const { track, title, album, artist } = GetDataForSong(store, songKey);

    return (
      <tr
        className={idx === curIndex ? 'playing' : 'not-playing'}
        key={idx}
        onDoubleClick={() => PlaySongNumber(store, idx)}
      >
        <td>
          <img
            className="delete-pic pic-button"
            src={deletePic}
            alt="Remove"
            onClick={() => RemoveSongNumber(store, idx)}
          />
        </td>
        <td>{album}</td>
        <td>{artist}</td>
        <td>{track}</td>
        <td>{title}</td>
      </tr>
    );
  });
  return (
    <>
      {modalDialogs}
      {headerLine}
      <Table striped hover size="sm">
        <thead>
          <tr>
            <td></td>
            <td>Album</td>
            <td>Artist</td>
            <td>#</td>
            <td>Title</td>
          </tr>
        </thead>
        <tbody>{songs}</tbody>
      </Table>
    </>
  );
};

export default NowPlaying;
