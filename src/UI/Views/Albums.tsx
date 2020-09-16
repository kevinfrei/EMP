// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState, CSSProperties } from 'react';
import { Dialog, DialogType, List } from '@fluentui/react';
import { useRecoilValue, useRecoilState } from 'recoil';

import { VerticalScrollFixedVirtualList } from '../Scrollables';
import SongLine from '../SongLine';
import { allAlbumKeysSel, allAlbumsSel } from '../../Recoil/MusicDbAtoms';
import { addAlbumAtom /* , addSongAtom */ } from '../../Recoil/api';

import type { Album } from '../../DataSchema';

import './styles/Albums.css';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const downChevron = require('../img/down-chevron.svg') as string;

export function AlbumView(): JSX.Element {
  const [, addAlbum] = useRecoilState(addAlbumAtom);
  const albums = useRecoilValue(allAlbumsSel);
  const albumArray = useRecoilValue(allAlbumKeysSel);
  const [expandedAlbum, setExpandedAlbum] = useState('');
  const handleClose = () => setExpandedAlbum('');
  let details = <></>;
  let dialogHeader = '';

  if (!!expandedAlbum) {
    const album = albums.get(expandedAlbum);
    if (album) {
      const artistName = album.key; // GetArtistForAlbum(store, album);
      details = (
        <div className="songListForAlbum">
          {album.songs.map((k) => (
            <SongLine />
          ))}
        </div>
      );
      dialogHeader = album.title + ' ' + artistName;
    }
  }

  function SingleAlbum({
    album,
    style,
  }: {
    album: Album;
    style: CSSProperties;
  }) {
    const artistName = [...album.primaryArtists.keys()].join(' & '); // GetArtistForAlbum(store, album);
    const adder = () => addAlbum(album.key);

    return (
      <div style={style} className="albumContainer">
        <img
          src={`pic://album/${album.key}`}
          onDoubleClick={() => addAlbum(album.key)}
          alt="album cover"
          className="albumCover"
        />
        <span>
          <div className="albumTitle" onDoubleClick={adder}>
            {album.title}
          </div>
          <div className="albumDetails">
            &nbsp;
            <span onDoubleClick={adder}>
              {artistName}
              {album.year ? `: ${album.year}` : ''} &nbsp;
              <img
                onClick={() => setExpandedAlbum(album.key)}
                src={downChevron}
                className="albumChevron"
                alt="expander"
              />
            </span>
          </div>
        </span>
      </div>
    );
  }

  function VirtualAlbumRow({
    index,
    style,
  }: {
    index: number;
    style: CSSProperties;
  }): JSX.Element {
    const maybeAlbum = albums.get(albumArray[index]);
    if (maybeAlbum) {
      return <SingleAlbum key={index} style={style} album={maybeAlbum} />;
    } else {
      return <div>Error for element {index}</div>;
    }
  }
  return (
    <div className="albumView current-view">
      <Dialog
        hidden={!expandedAlbum}
        onDismiss={handleClose}
        dialogContentProps={{ type: DialogType.close, title: dialogHeader }}
      >
        {details}
      </Dialog>
      <VerticalScrollFixedVirtualList
        scrollId="AlbumsScrollPos"
        itemCount={albums.size}
        itemSize={70}
        itemGenerator={VirtualAlbumRow}
      />
    </div>
  );
}

export default function NewAlbumView(): JSX.Element {
  const allAlbums = useRecoilValue(allAlbumsSel);
  return <List items={[...(allAlbums.values() as Iterable<Album>)]} />;
}
