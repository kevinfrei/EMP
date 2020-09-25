// eslint-disable-next-line @typescript-eslint/no-use-before-define
import { DetailsList, SelectionMode } from '@fluentui/react';
import { Album, AlbumKey } from '@freik/media-utils';
import React, { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddSongList } from '../../Recoil/api';
import { currentIndexAtom, songListAtom } from '../../Recoil/Local';
import { allAlbumsSel, allSongsSel } from '../../Recoil/ReadOnly';
import {
  AlbumFromSong,
  ArtistsFromSong,
  GetSongGroupData,
  makeColumns,
} from '../SongList';
import './styles/Albums.css';

export default function NewAlbumView(): JSX.Element {
  const allAlbums = useRecoilValue(allAlbumsSel);
  const allSongs = useRecoilValue(allSongsSel);
  const curIndexState = useRecoilState(currentIndexAtom);
  const songListState = useRecoilState(songListAtom);
  const curExpandedState = useState(new Set<AlbumKey>());

  const [songs, groups, groupProps] = GetSongGroupData<Album>(
    allAlbums,
    allSongs,
    curExpandedState,
    (al: Album) => al.songs,
    (al: Album) => al.title,
  );

  const columns = makeColumns(
    // TODO: Get the sorting in place
    () => '',
    () => {
      ' ';
    },
    'albumId',
    ['l', 'albumId', 'Album', 50, 175, AlbumFromSong],
    ['r', 'primaryArtists', 'Artist', 50, 250, ArtistsFromSong],
    ['n', 'track', '#', 10, 20],
    ['t', 'title', 'Title', 50, 150],
  );
  return (
    <div className="current-view songListForAlbum" data-is-scrollable="true">
      <DetailsList
        items={songs}
        selectionMode={SelectionMode.none}
        groups={groups}
        columns={columns}
        onItemInvoked={(item: Album) =>
          AddSongList(item.songs, curIndexState, songListState)
        }
        groupProps={groupProps}
      />
    </div>
  );
}
