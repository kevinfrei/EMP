// @flow

import * as React from 'react';
import Store from '../MyStore';
import { GetDataForSong } from '../DataAccess';
import {
  PlayingPlaylist,
  GetSongKey,
  PlaySongNumber,
  StopAndClear,
  RemoveSongNumber,
} from '../Playlist';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import type { PlaySet } from '../MyStore';

import './styles/NowPlaying.css';
import deletePic from '../img/delete.svg';

const Header = () => {
  const store = Store.useStore();
  const nowPlaying: PlaySet = store.get('nowPlaying');
  let header;
  let button;
  const save = () => window.alert('save');
  const saveAs = () => window.alert('Save As');
  const del = () => StopAndClear(store);
  if (PlayingPlaylist(nowPlaying)) {
    header = nowPlaying.name;
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
  const nowPlaying: PlaySet = store.get('nowPlaying');
  const songs = nowPlaying.songs.map((val, idx) => {
    const songKey = GetSongKey(store, nowPlaying, idx);
    const { track, title, album, artist } = GetDataForSong(store, songKey);

    return (
      <tr
        className={idx === nowPlaying.pos ? 'playing' : 'not-playing'}
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
