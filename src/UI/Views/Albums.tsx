import {
  DetailsList,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { Logger } from '@freik/core-utils';
import { Album, AlbumKey, Song } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddSongList } from '../../Recoil/api';
import { currentIndexAtom, songListAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
} from '../../Recoil/ReadOnly';
import { sortWithArticlesAtom } from '../../Recoil/ReadWrite';
import { SortSongs } from '../../Tools';
import {
  AlbumFromSong,
  ArtistsFromSong,
  GetSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/Albums.css';

const log = Logger.bind('Albums');
// Logger.enable('Albums');

export default function NewAlbumView(): JSX.Element {
  const albums = useRecoilValue(allAlbumsSel);
  const allSongsMap = useRecoilValue(allSongsSel);
  const artists = useRecoilValue(allArtistsSel);
  const articles = useRecoilValue(sortWithArticlesAtom);
  const curIndexState = useRecoilState(currentIndexAtom);
  const songListState = useRecoilState(songListAtom);
  const [curSort, setSort] = useState<string>('l');
  const curExpandedState = useState(new Set<AlbumKey>());
  const [sortedSongs, setSortedSongs] = useState(
    SortSongs('l', [...allSongsMap.values()], albums, artists, articles),
  );

  // This takes a sort string, shuffles it to always have the groupId first
  // then sorts according to the order specified
  const performSort = (srt: string) => {
    if (srt !== curSort) {
      setSort(srt);
      log(`Sorting Albums: ${srt}`);
      setSortedSongs(SortSongs(srt, sortedSongs, albums, artists, articles));
    }
  };

  const [columns, groups, groupProps] = GetSongGroupData(
    sortedSongs,
    curExpandedState,
    (s: Song) => s.albumId,
    (ak: AlbumKey) => {
      const album = albums.get(ak);
      if (!album) {
        return `Error: unknown album id: ${ak}`;
      }
      return `${album.title} - ${album.year}`;
    },
    'l',
    'albumId',
    [
      ['l', 'albumId', 'Album', 50, 175, AlbumFromSong],
      ['r', 'primaryArtists', 'Artist', 50, 250, ArtistsFromSong],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    // TODO: Get the sorting in place
    () => curSort,
    performSort,
  );
  return (
    <div className="current-view songListForAlbum" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          compact={true}
          items={sortedSongs}
          selectionMode={SelectionMode.none}
          groups={groups}
          columns={columns}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemInvoked={(item: Album) =>
            AddSongList(item.songs, curIndexState, songListState)
          }
          groupProps={groupProps}
        />
      </ScrollablePane>
    </div>
  );
}
