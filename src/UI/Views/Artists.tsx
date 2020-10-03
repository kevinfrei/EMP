import {
  DetailsList,
  IconButton,
  IDetailsGroupRenderProps,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Stack,
  Text,
} from '@fluentui/react';
import { Logger } from '@freik/core-utils';
import { ArtistKey, Song } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue } from 'recoil';
import { GetArtistString } from '../../DataSchema';
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
import { ViewProps } from './Selector';
import './styles/Artists.css';

const log = Logger.bind('Artists');
Logger.enable('Artists');

export default function NewArtistList({ hidden }: ViewProps): JSX.Element {
  const allSongsMap = useRecoilValue(allSongsSel);
  const artists = useRecoilValue(allArtistsSel);
  const albums = useRecoilValue(allAlbumsSel);
  const articles = useRecoilValue(sortWithArticlesAtom);
  const curIndexState = useRecoilState(currentIndexAtom);
  const songListState = useRecoilState(songListAtom);
  const [curSort, setSort] = useState<string>('r');
  const curExpandedState = useState(new Set<ArtistKey>());
  const [sortedSongs, setSortedSongs] = useState(
    SortSongs('r', [...allSongsMap.values()], albums, artists, articles),
  );

  const performSort = (srt: string) => {
    if (srt !== curSort) {
      setSort(srt);
      log(`Sorting Artists: ${srt}`);
      setSortedSongs(SortSongs(srt, sortedSongs, albums, artists, articles));
    }
  };
  const renderArtistHeader: IDetailsGroupRenderProps['onRenderHeader'] = (
    props,
  ) => {
    if (!props) return null;
    return (
      <Stack horizontal verticalAlign="center">
        <IconButton
          iconProps={{
            iconName: props.group?.isCollapsed ? 'ChevronRight' : 'ChevronDown',
          }}
          onClick={() => props.onToggleCollapse!(props.group!)}
        />
        <Text
          onDoubleClick={() =>
            AddSongList(
              artists.get(props.group!.key)!.songs,
              curIndexState,
              songListState,
            )
          }
        >
          {props.group?.name}
        </Text>
      </Stack>
    );
  };
  const [columns, artistGroups, groupProps] = GetSongGroupData(
    sortedSongs,
    curExpandedState,
    (s: Song) => s.artistIds.join(';'),
    (s: string) => GetArtistString(s.split(';'), artists) || '',
    'r',
    'artistIds',
    [
      ['r', 'artistIds', 'Artist', 50, 175, ArtistsFromSong],
      ['l', 'albumId', 'Album', 50, 175, AlbumFromSong],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    () => curSort,
    performSort,
  );
  groupProps.onRenderHeader = renderArtistHeader;
  return (
    <div
      className="current-view artistView"
      data-is-scrollable="true"
      style={hidden ? { visibility: 'hidden' } : {}}
    >
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          compact={true}
          selectionMode={SelectionMode.none}
          items={sortedSongs}
          groups={artistGroups}
          groupProps={groupProps}
          columns={columns}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemInvoked={(item: Song) =>
            AddSongList([item.key], curIndexState, songListState)
          }
        />
      </ScrollablePane>
    </div>
  );
}
