// @flow
import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import Store from '../MyStore';

import SongLine from '../SongLine';
import { AddSong } from '../Playlist';

import type { Properties } from 'csstype';

import './styles/MixedSongs.css';
import { VerticalScrollFixedVirtualList } from '../Scrollables';

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

export default function MixedSongView() {
  const store = Store.useStore();
  const songs = store.get('Songs');
  const songArray = store.get('SongArray');
  const [selected, setSelected] = useState('');

  const handleClose = () => setSelected('');
  let details = <></>;

  const VirtualSongRow = ({
    index,
    style,
  }: {
    index: number,
    style: Properties<>,
  }):React$Node => {
    return (
      <SongLine
        template="RL#T"
        key={index}
        style={style}
        className={
          index & 1
            ? 'songContainer evenMixedSong'
            : 'songContainer oddMixedSong'
        }
        songKey={songArray[index]}
        onDoubleClick={AddSong}
        onAuxClick={(store, songKey) => setSelected(songKey)}
      />
    );
  };

  if (!!selected) {
    const mdCache = store.get('MediaInfoCache');
    const mediaInfo = mdCache.get(selected);
    if (mediaInfo) {
      const genLines = mediaInfoToLine('gen', mediaInfo.general);
      const audLines = mediaInfoToLine('aud', mediaInfo.audio);
      details = (
        <table>
          <thead>
            <tr>
              <td>General</td>
            </tr>
          </thead>
          <tbody>{genLines}</tbody>
          <thead>
            <tr>
              <td>Audio</td>
            </tr>
          </thead>
          <tbody>{audLines}</tbody>
        </table>
      );
    } else {
      details = 'Please wait...';
      window.ipc.send('mediainfo', selected);
    }
  }

  return (
    <div className="songView">
      <Modal show={!!selected} onHide={handleClose}>
        <Modal.Dialog>
          <Modal.Header closeButton>
            <Modal.Title>Metadata</Modal.Title>
          </Modal.Header>
          <Modal.Body>{details}</Modal.Body>
        </Modal.Dialog>
      </Modal>
      <div className="songContainer songHeader">
        <span className="songArtist">Artist</span>
        <span className="songAlbum">Album</span>
        <span className="songTrack">#</span>
        <span className="songTitle">Title</span>
      </div>
      <VerticalScrollFixedVirtualList
        scrollId="mixedSongsScrollId"
        itemCount={songs.size}
        itemSize={28}
        itemGenerator={VirtualSongRow}
      />
    </div>
  );
}
