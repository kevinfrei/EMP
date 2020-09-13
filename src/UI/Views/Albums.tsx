// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState, CSSProperties } from 'react';
import { Dialog, DialogType, List } from '@fluentui/react';

import Store from '../../MyStore';

import { GetArtistForAlbum } from '../../DataAccess';
import { VerticalScrollFixedVirtualList } from '../Scrollables';
import SongLine from '../SongLine';

import { useRecoilValue } from 'recoil';
import { AllAlbums } from '../../Recoil/MusicDbAtoms';
import { useRecoilState } from 'recoil';
import { AddAlbumAtom, AddSongAtom } from '../../Recoil/api';

import type { Album } from '../../MyStore';

import './styles/Albums.css';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const downChevron = require('../img/down-chevron.svg') as string;

export function AlbumView(): JSX.Element {
  const [, AddSong] = useRecoilState(AddSongAtom);
  const [, AddAlbum] = useRecoilState(AddAlbumAtom);
  const store = Store.useStore();
  const albums = store.get('Albums');
  const albumArray = store.get('AlbumArray');
  const [expandedAlbum, setExpandedAlbum] = useState('');
  const handleClose = () => setExpandedAlbum('');
  let details = <></>;
  let dialogHeader = '';

  if (!!expandedAlbum) {
    const album = albums.get(expandedAlbum);
    if (album) {
      const artistName = GetArtistForAlbum(store, album);
      details = (
        <div className="songListForAlbum">
          {album.songs.map((k) => (
            <SongLine
              template="R#T"
              key={k}
              songKey={k}
              className="songForAlbum"
              onDoubleClick={(st, songKey) => AddSong(songKey)}
            />
          ))}
        </div>
      );
      dialogHeader = album.title + ' ' + artistName;
    }
  }

  const SingleAlbum = ({
    album,
    style,
  }: {
    album: Album;
    style: CSSProperties;
  }) => {
    const artistName = GetArtistForAlbum(store, album);
    const adder = () => AddAlbum(album.key);

    return (
      <div style={style} className="albumContainer">
        <img
          src={`pic://album/${album.key}`}
          onDoubleClick={() => AddAlbum(album.key)}
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
  };

  const VirtualAlbumRow = ({
    index,
    style,
  }: {
    index: number;
    style: CSSProperties;
  }): JSX.Element => {
    const maybeAlbum = albums.get(albumArray[index]);
    if (maybeAlbum) {
      return <SingleAlbum key={index} style={style} album={maybeAlbum} />;
    } else {
      return <div>Error for element {index}</div>;
    }
  };
  return (
    <div className="albumView">
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

function TheList() {
  const allAlbums = useRecoilValue(AllAlbums);
  return <List items={[...allAlbums.values()]} />;
}
export default function NewAlbumView(): JSX.Element {
  return (
    <React.Suspense fallback="Please Hold...">
      <TheList />
    </React.Suspense>
  );
}
