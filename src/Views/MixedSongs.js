// @flow
import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';

import Store from '../MyStore';

import { GetDataForSong } from '../DataAccess';
import { AddSong, StartPlaylist } from '../Playlist';
import { SongByRLNT } from '../Sorters';

import type { SongKey, StoreState } from '../MyStore';
import type { VirtualViewInfo } from './Selector';

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

const MixedSongLine = ({
  songKey,
  style,
}: {
  songKey: SongKey,
  style: Object,
}) => {
  const [open, setOpen] = useState(false);
  const store = Store.useStore();
  const { title, track, album, artist } = GetDataForSong(store, songKey);
  let details = <></>;
  if (false && open) {
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
    <div
      style={style}
      onDoubleClick={() => AddSong(store, songKey)}
      onAuxClick={() => setOpen(!open)}
    >
      <span>{artist}</span>
      <span>{album}</span>
      <span>{track}</span>
      <span>{title}</span>
    </div>
  );
};

function VirtualSongRow({ index, style }: { index: number, style: object }) {
  const store = Store.useStore();
  const songs = store.get('Songs');
  const songArray = store.get('SongArray');
  return <MixedSongLine style={style} songKey={songArray[index]} />;
}

const VirtualSongView = {
  name: 'Songs',
  height: 20,
  rowCreator: VirtualSongRow,
};

export default VirtualSongView;
