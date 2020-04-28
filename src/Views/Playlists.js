// @flow

// @flow

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import ListGroupItem from 'react-bootstrap/ListGroupItem';

import Store from '../MyStore';

import { StartPlaylist } from '../Playlist';
import { GetTrackListingForSong } from '../DataAccess';

import type { SongKey } from '../MyStore';

import './styles/NowPlaying.css';
import downChevron from '../img/down-chevron.svg';

function Playlist({ name, playing }: { name: string, playing: boolean }) {
  const store = Store.useStore();
  const [showSongs, setShowSongs] = useState(false);
  const playlists = store.get('Playlists');
  const thisPlaylist = playlists.get(name);
  if (!thisPlaylist) {
    return <></>;
  }
  const expanderStyle = showSongs ? {} : { transform: 'rotate(-90deg)' };
  const theSongs = !showSongs ? (
    <></>
  ) : (
    <ListGroup>
      {thisPlaylist.map((sk: SongKey) => (
        <ListGroupItem>{GetTrackListingForSong(store, sk)}</ListGroupItem>
      ))}
    </ListGroup>
  );

  return (
    <Card
      className={playing ? 'playing' : 'not-playing'}
      onDoubleClick={() => StartPlaylist(store, name)}
    >
      <Card.Body>
        <Card.Title>{name}</Card.Title>
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
  let store = Store.useStore();
  const playlists = store.get('Playlists');
  const curPls = store.get('activePlaylistName');
  const names = [...playlists.keys()];
  names.sort();
  return (
    <div>
      {names.map((name: string) => (
        <Playlist
          store={store}
          key={name}
          name={name}
          playing={name === curPls}
        />
      ))}
    </div>
  );
}
