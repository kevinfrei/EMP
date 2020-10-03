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
import { AlbumKey, Song } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddSongList } from '../../Recoil/api';
import {
  currentIndexAtom,
  songDetailAtom,
  songListAtom,
} from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
  dataForAlbumSel,
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
import './styles/Albums.css';

const log = Logger.bind('Albums');
// Logger.enable('Albums');

export function AlbumHeaderDisplay(props: { albumKey: string }): JSX.Element {
  const albumData = useRecoilValue(dataForAlbumSel(props.albumKey));
  return (
    <Text>{`${albumData.album} - ${albumData.year} [${albumData.artist}]`}</Text>
  );
}

export default function NewAlbumView({ hidden }: ViewProps): JSX.Element {
  const albums = useRecoilValue(allAlbumsSel);
  const allSongsMap = useRecoilValue(allSongsSel);
  const artists = useRecoilValue(allArtistsSel);
  const articles = useRecoilValue(sortWithArticlesAtom);
  const curIndexState = useRecoilState(currentIndexAtom);
  const songListState = useRecoilState(songListAtom);
  const [, setDetailSong] = useRecoilState(songDetailAtom);
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
  const renderAlbumHeader: IDetailsGroupRenderProps['onRenderHeader'] = (
    props,
  ): JSX.Element | null => {
    if (!props || !props.group) return null;
    const albumId = props.group.key;
    return (
      <Stack horizontal verticalAlign="center">
        <IconButton
          iconProps={{
            iconName: props.group?.isCollapsed ? 'ChevronRight' : 'ChevronDown',
          }}
          onClick={() => props.onToggleCollapse!(props.group!)}
        />
        <Stack
          horizontal
          verticalAlign="center"
          onDoubleClick={() =>
            AddSongList(
              albums.get(albumId)!.songs,
              curIndexState,
              songListState,
            )
          }
        >
          <AlbumHeaderDisplay albumKey={albumId} />
        </Stack>
      </Stack>
    );
    /* This takes Electron to it's knees:
              <Image
            src={`pic://album/${albumId}`}
            height={25}
            width={25}
            imageFit={ImageFit.centerContain}
          />
*/
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
    () => curSort,
    performSort,
  );
  groupProps.onRenderHeader = renderAlbumHeader;
  return (
    <div
      className="current-view songListForAlbum"
      data-is-scrollable="true"
      style={hidden ? { visibility: 'hidden' } : {}}
    >
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          compact={true}
          items={sortedSongs}
          selectionMode={SelectionMode.none}
          groups={groups}
          columns={columns}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={(item: Song) => setDetailSong(item)}
          onItemInvoked={(item: Song) =>
            AddSongList([item.key], curIndexState, songListState)
          }
          groupProps={groupProps}
        />
      </ScrollablePane>
    </div>
  );
}
