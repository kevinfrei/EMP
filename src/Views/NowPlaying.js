// @flow

import * as React from 'react';
import Store from '../MyStore';
import { GetDataForSong } from '../DataAccess';
import {
  PlayingPlaylist,
  PlaySongNumber,
  StopAndClear,
  RemoveSongNumber,
} from '../Playlist';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import './styles/NowPlaying.css';
import deletePic from '../img/delete.svg';

const Header = () => {
  const store = Store.useStore();
  const nowPlaying: string = store.get('activePlaylistName');
  let header;
  let button;
  const save = () => window.alert('save');
  const saveAs = () => window.alert('Save As');
  const del = () => StopAndClear(store);
  if (PlayingPlaylist(nowPlaying)) {
    header = nowPlaying;
    // Only use this button if it's been modified?
    button = <Button onClick={save}>Save</Button>;
  } else {
    header = 'Now Playing';
    button = <></>;
  }
  const clear = (
    <img
      className="delete-pic pic-button"
      src={deletePic}
      alt="Remove"
      onClick={del}
    />
  );
  return (
    <h4 style={{ margin: '3pt' }}>
      {header}&nbsp;
      {clear}
      {button}
      <Button size="sm" style={{ float: 'right' }} onClick={saveAs}>
        Save As...
      </Button>
    </h4>
  );
};
const NowPlaying = () => {
  const store = Store.useStore();
  const songList = store.get('songList');
  const curIndex = store.get('curIndex');
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
      <Header />
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
