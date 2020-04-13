// @flow

import * as React from 'react';
import Store from '../MyStore';
import { GetDataForSong } from '../DataAccess';
import { PlayingPlaylist, GetSongKey, PlaySongNumber } from '../Playlist';

import type { PlaySet } from '../MyStore';

import './styles/NowPlaying.css';

const NowPlaying = () => {
  const store = Store.useStore();
  const nowPlaying: PlaySet = store.get('nowPlaying');
  const header = PlayingPlaylist(nowPlaying) ? nowPlaying.name : 'Now Playing';
  const songs = nowPlaying.songs.map((val, idx) => {
    const songKey = GetSongKey(store, nowPlaying, idx);
    const { track, title, album, artist } = GetDataForSong(store, songKey);
    return (
      <div
        className={
          idx === nowPlaying.pos ? 'currently-playing' : 'sitting-in-list'
        }
        key={idx}
        onDoubleClick={() => PlaySongNumber(store, idx)}
      >{`${album} (${artist}) ${track}: ${title}`}</div>
    );
  });
  return (
    <>
      <div className="header">{header}</div>
      {songs}
    </>
  );
};

export default NowPlaying;
