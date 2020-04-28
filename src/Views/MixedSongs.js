// @flow
import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';

import Store from '../MyStore';

import { GetDataForSong } from '../DataAccess';
import { AddSong, StartPlaylist } from '../Playlist';
import { SongByRLNT } from '../Sorters';

import type { SongKey } from '../MyStore';

function mediaInfoToLine(keyPrefix: string, strs: Map<string, string>) {
  const lines = [];
  strs.forEach((val, key) =>
    lines.push(
      <tr key={keyPrefix + key}>
        <td>{key}</td>
        <td colSpan={3}>{val}</td>
      </tr>
    )
  );
  return lines;
}

const MixedSongLine = ({ songKey }: { songKey: SongKey }) => {
  const [open, setOpen] = useState(false);
  const store = Store.useStore();
  const { title, track, album, artist } = GetDataForSong(store, songKey);
  let details = <></>;
  if (open) {
    const mdCache = store.get('MediaInfoCache');
    const mediaInfo = mdCache.get(songKey);
    if (mediaInfo) {
      const genLines = mediaInfoToLine('gen', mediaInfo.general);
      const audLines = mediaInfoToLine('aud', mediaInfo.audio);
      details = (
        <>
          <tr>
            <td>General</td>
          </tr>
          {genLines}
          <tr>
            <td>Audio</td>
          </tr>
          {audLines}
        </>
      );
    } else {
      details = (
        <tr>
          <td colSpan={4}>Please wait...</td>
        </tr>
      );
      window.ipc.send('mediainfo', songKey);
    }
  }
  return (
    <>
      <tr
        onDoubleClick={() => AddSong(store, songKey)}
        onAuxClick={() => setOpen(!open)}
      >
        <td>{artist}</td>
        <td>{album}</td>
        <td>{track}</td>
        <td>{title}</td>
      </tr>
      {details}
    </>
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
