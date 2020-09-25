import {
  DetailsList,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { Artist, ArtistKey, Song } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddSongList } from '../../Recoil/api';
import { currentIndexAtom, songListAtom } from '../../Recoil/Local';
import { allArtistsSel, allSongsSel } from '../../Recoil/ReadOnly';
import {
  AlbumFromSong,
  ArtistsFromSong,
  GetSongGroupData,
  makeColumns,
} from '../SongList';
import './styles/Artists.css';

export default function NewArtistList(): JSX.Element {
  const allSongsMap = useRecoilValue(allSongsSel);
  const allArtists = useRecoilValue(allArtistsSel);
  const curIndexState = useRecoilState(currentIndexAtom);
  const songListState = useRecoilState(songListAtom);
  const curExpandedState = useState(new Set<ArtistKey>());

  const [songs, artistGroups, groupProps] = GetSongGroupData<Artist>(
    allArtists,
    allSongsMap,
    curExpandedState,
    (ar: Artist) => ar.songs,
    (ar: Artist) => ar.name,
  );
  const columns = makeColumns(
    () => '',
    (str: string) => {
      return;
    },
    'artistIds',
    ['r', 'artistIds', 'Artist', 50, 175, ArtistsFromSong],
    ['l', 'albumId', 'Album', 50, 175, AlbumFromSong],
    ['n', 'track', '#', 10, 20],
    ['t', 'title', 'Title', 50, 150],
  );

  return (
    <div className="current-view artistView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          selectionMode={SelectionMode.none}
          items={songs}
          groups={artistGroups}
          columns={columns}
          onItemInvoked={(item: Song) =>
            AddSongList([item.key], curIndexState, songListState)
          }
          groupProps={groupProps}
        />
      </ScrollablePane>
    </div>
  );
}
