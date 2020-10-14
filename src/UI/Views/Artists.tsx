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
import { MakeLogger } from '@freik/core-utils';
import { Artist, ArtistKey, Song } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { GetArtistString, GetArtistStringFromKeys } from '../../DataSchema';
import { AddSongs } from '../../Recoil/api';
import { songDetailAtom } from '../../Recoil/Local';
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

const log = MakeLogger('Artists', true);

export function ArtistHeaderDisplay(props: { artists: Artist[] }): JSX.Element {
  const onAddSongsClick = useRecoilCallback(({ set }) => () =>
    props.artists.forEach((art) => AddSongs(art.songs, set)),
  );
  const name = GetArtistString(props.artists);
  const songCount = props.artists.reduce<number>(
    (prev: number, cur: Artist) => prev + cur.songs.length,
    0,
  );
  return (
    <Stack horizontal verticalAlign="center" onDoubleClick={onAddSongsClick}>
      <Text>{`${name} [${songCount} song${songCount > 1 ? 's' : ''}]`}</Text>
    </Stack>
  );
}
export default function NewArtistList({ hidden }: ViewProps): JSX.Element {
  const allSongsMap = useRecoilValue(allSongsSel);
  const artists = useRecoilValue(allArtistsSel);
  const albums = useRecoilValue(allAlbumsSel);
  const articles = useRecoilValue(sortWithArticlesAtom);
  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailAtom, item),
  );
  const onAddSongClick = useRecoilCallback(({ set }) => (item: Song) =>
    AddSongs([item.key], set),
  );
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
    const artistKeys = props.group?.key;
    if (!artistKeys) return null;
    const artistList = artistKeys
      .split(';')
      .map((ak) => artists.get(ak)!)
      .filter((ak) => !!ak);
    if (!artistList) return null;
    return (
      <Stack horizontal verticalAlign="center">
        <IconButton
          iconProps={{
            iconName: props.group?.isCollapsed ? 'ChevronRight' : 'ChevronDown',
          }}
          onClick={() => props.onToggleCollapse!(props.group!)}
        />
        <ArtistHeaderDisplay artists={artistList} />
      </Stack>
    );
  };
  const [columns, artistGroups, groupProps] = GetSongGroupData(
    sortedSongs,
    curExpandedState,
    (s: Song) => s.artistIds.join(';'),
    (s: string) => GetArtistStringFromKeys(s.split(';'), artists) || '',
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
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={onAddSongClick}
        />
      </ScrollablePane>
    </div>
  );
}
