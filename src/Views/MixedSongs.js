// @flow
import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';

import Store from '../MyStore';

import { AddSong } from '../Playlist';
import SongLine from '../SongLine';

import type { SongKey, StoreState } from '../MyStore';

/*

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
        onAuxClick={() => setOpen(!open)}

  */

function VirtualSongRow({ index, style }: { index: number, style: Object }) {
  const store = Store.useStore();
  const songArray = store.get('SongArray');
  return (
    <SongLine
      template="RL#T"
      key={index}
      style={style}
      className={index & 1 ? 'evenSong' : 'oddSong'}
      songKey={songArray[index]}
      onDoubleClick={AddSong}
    />
  );
}

const VirtualSongView = {
  name: 'Songs',
  height: 20,
  rowCreator: VirtualSongRow,
};

export default VirtualSongView;
