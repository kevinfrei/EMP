// @flow
import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';

import Store from '../MyStore';

import { GetDataForSong } from '../DataAccess';
import { AddSong } from '../Playlist';
import { SongByRLNT } from '../Sorters';

import type { SongKey } from '../MyStore';

const MixedSongLine = ({ songKey }: { songKey: SongKey }) => {
  const [, setOpen] = useState(false);
  const store = Store.useStore();
  const { title, track, album, artist } = GetDataForSong(store, songKey);
  return (
    <tr
      onDoubleClick={() => AddSong(store, songKey)}
      onAuxClick={() => setOpen(true)}
    >
      <td>{artist}</td>
      <td>{album}</td>
      <td>{track}</td>
      <td>{title}</td>
    </tr>
  );
};

const MixedSongsView = () => {
  let store = Store.useStore();
  const songs = store.get('Songs');
  const sngs: Array<SongKey> = Array.from(songs.keys());
  sngs.sort(SongByRLNT(store));
  return (
    <Table striped hover size="sm">
      <thead>
        <tr>
          <td>Album</td>
          <td>Artist</td>
          <td>#</td>
          <td>Title</td>
        </tr>
      </thead>
      <tbody>
        {sngs.map((s) => (
          <MixedSongLine key={s} songKey={s} />
        ))}
      </tbody>
    </Table>
  );
};

export default MixedSongsView;
