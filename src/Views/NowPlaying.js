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

  const [showSaveAs, setShowSaveAs] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [inputName, setInputName] = useState(nowPlaying);

  // Helpers for the SaveAs dialog
  const justCloseSaveAs = () => setShowSaveAs(false);
  const showSaveDialog = () => setShowSaveAs(true);
  const saveAndClose = () => {
    if (curPls.get(inputName)) {
      window.alert('Cowardly refusing to overwrite existing playlist.');
    } else {
      curPls.set(inputName, [...songList]);
      setCurPls(curPls);
      setNowPlaying(inputName);
    }
    justCloseSaveAs();
  };
  // Helpers for the Confirm Delete dialog
  const closeConfirmation = () => setShowConfirmation(false);
  const approvedConfirmation = () => {
    StopAndClear(store);
    closeConfirmation();
  };

  const modalDialogs = (
    <>
      <Modal show={showSaveAs} onHide={justCloseSaveAs}>
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
          <Button variant="secondary" onClick={justCloseSaveAs}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveAndClose}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showConfirmation} onHide={closeConfirmation}>
        <Modal.Header closeButton>
          <Modal.Title>
            Please Confirm
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the playlist?
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={approvedConfirmation}>Yes</Button>
          <Button onClick={closeConfirmation}>No</Button>
        </Modal.Footer>
      </Modal>
    </>
  );

  let header;
  let button;
  const save = () => {
    curPls.set(nowPlaying, [...songList]);
    setCurPls(curPls);
  };
  if (PlayingPlaylist(nowPlaying)) {
    header = nowPlaying;
    // Only use this button if it's been modified?
    const curPlList = curPls.get(nowPlaying);
    const disabled =
      !curPlList || Comparisons.ArraySetEqual(songList, curPlList);
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
        onClick={() => setShowConfirmation(true)}
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
