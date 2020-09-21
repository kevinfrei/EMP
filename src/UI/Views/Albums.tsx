// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { DetailsList, SelectionMode } from '@fluentui/react';
import { useRecoilValue, useRecoilState } from 'recoil';

import { allAlbumsSel } from '../../Recoil/ReadOnly';
import { addSongListAtom } from '../../Recoil/api';
import { ArtistsFromAlbum, makeColumns } from '../SongList';

import type { Album } from '@freik/media-utils';

import './styles/Albums.css';

export default function NewAlbumView(): JSX.Element {
  const allAlbums = useRecoilValue(allAlbumsSel);
  const [, addSongList] = useRecoilState(addSongListAtom);

  const albums = [...allAlbums.values()];
  const columns = makeColumns<Album>(
    // TODO: Get the sorting in place
    () => '',
    () => {
      ' ';
    },
    ['r', 'primaryArtists', 'Artist', 50, 250, ArtistsFromAlbum],
    ['l', 'title', 'Album Title', 50, 250],
  );
  return (
    <div className="current-view songListForAlbum" data-is-scrollable="true">
      <DetailsList
        items={albums}
        selectionMode={SelectionMode.none}
        columns={columns}
        onItemInvoked={(item: Album) => addSongList(item.songs)}
      />
    </div>
  );
}
