// @flow

import * as React from 'react';
import Store from '../MyStore';
import { GetDataForSong } from '../DataAccess';
import {
  PlayingPlaylist,
  GetSongKey,
  PlaySongNumber,
  StopAndClear,
} from '../Playlist';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import type { PlaySet } from '../MyStore';

import './styles/NowPlaying.css';

const NowPlaying = () => {
  const store = Store.useStore();
  const nowPlaying: PlaySet = store.get('nowPlaying');
  let header;
  let button;
  if (PlayingPlaylist(nowPlaying)) {
    header = nowPlaying.name;
    button = <></>;
  } else {
    header = 'Now Playing';
    button = (
      <Button
        id="clear-now-playing"
        onClick={() => StopAndClear(store)}
        variant="light"
        size="sm"
      >
        Clear
      </Button>
    );
  }
  const songs = nowPlaying.songs.map((val, idx) => {
    const songKey = GetSongKey(store, nowPlaying, idx);
    const { track, title, album, artist } = GetDataForSong(store, songKey);
    return (
      <tr
        className={idx === nowPlaying.pos ? 'playing' : 'not-playing'}
        key={idx}
        onDoubleClick={() => PlaySongNumber(store, idx)}
      >
        <td>{album}</td>
        <td>{artist}</td>
        <td>{track}</td>
        <td>{title}</td>
      </tr>
    );
  });
  return (
    <Table striped hover size="sm">
      <thead>
        <tr>
          <td>{header}</td>
          <td></td>
          <td></td>
          <td>{button}</td>
        </tr>
      </thead>
      <thead>
        <tr>
          <td>Album</td>
          <td>Artist</td>
          <td>#</td>
          <td>Title</td>
        </tr>
      </thead>
      <tbody>{songs}</tbody>
    </Table>
  );
};

export default NowPlaying;
