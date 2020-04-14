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
      <input
        id="clear-now-playing"
        type="button"
        value="Clear"
        onClick={() => StopAndClear(store)}
      />
    );
  }
  const songs = nowPlaying.songs.map((val, idx) => {
    const songKey = GetSongKey(store, nowPlaying, idx);
    const { track, title, album, artist } = GetDataForSong(store, songKey);
    return (
      <div
        className={idx === nowPlaying.pos ? 'playing' : 'list'}
        key={idx}
        onDoubleClick={() => PlaySongNumber(store, idx)}
      >{`${album} (${artist}) ${track}: ${title}`}</div>
    );
  });
  return (
    <>
      <div className="header">{header}</div>
      {button}
      <p />
      <hr />
      {songs}
    </>
  );
};

export default NowPlaying;
