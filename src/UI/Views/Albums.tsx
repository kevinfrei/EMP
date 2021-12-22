import {
  DetailsList,
  IconButton,
  IDetailsList,
  IGroup,
  Image,
  ImageFit,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Stack,
  Text,
} from '@fluentui/react';
import { MakeError, Type } from '@freik/core-utils';
import { AlbumKey, Song } from '@freik/media-core';
import { MyTransactionInterface, useMyTransaction } from '@freik/web-utils';
import { useState } from 'react';
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';
import { AddSongs, SongListFromKey } from '../../Recoil/api';
import { MakeSetState } from '../../Recoil/helpers';
import { albumCoverUrlFuncFam, focusedKeysFuncFam } from '../../Recoil/Local';
import {
  albumByKeyFuncFam,
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  dataForAlbumFuncFam,
} from '../../Recoil/ReadOnly';
import { CurrentView, ignoreArticlesState } from '../../Recoil/ReadWrite';
import {
  articlesCmp,
  MakeSortKey,
  noArticlesCmp,
  SortSongsFromAlbums,
} from '../../Sorting';
import { GetIndexOf } from '../../Tools';
import {
  AlbumForSongRender,
  ArtistsForSongRender,
  YearForSongRender,
} from '../SimpleTags';
import {
  altRowRenderer,
  ProcessSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import './styles/Albums.css';

const err = MakeError('Albums-err'); // eslint-disable-line

// This is used to trigger the popup menu in the list view
const albumContextState = atom<SongListMenuData>({
  key: 'albumContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

const [albumExpandedState, albumIsExpandedState] =
  MakeSetState<AlbumKey>('albumExpanded');

// For grouping to work properly, the sort order needs to be fully specified
// Also, the album year, VA type, and artist have to "stick" with the album name
// as a single group, or you get duplicate group IDs
const albumSortState = atom({
  key: 'newAlbumSort',
  default: MakeSortKey(['l', 'n'], ['lry', 'nrt']),
});

type AHDProps = { group: IGroup };
function AlbumHeaderDisplay({ group }: AHDProps): JSX.Element {
  const album = useRecoilValue(albumByKeyFuncFam(group.key));
  const albumData = useRecoilValue(dataForAlbumFuncFam(group.key));
  const picurl = useRecoilValue(albumCoverUrlFuncFam(group.key));
  const onAddSongsClick = useMyTransaction((xact) => () => {
    AddSongs(xact, album.songs);
  });
  const onHeaderExpanderClick = useMyTransaction(
    ({ set }) =>
      () =>
        set(albumIsExpandedState(group.key), !group.isCollapsed),
  );
  const onRightClick = useMyTransaction(
    ({ set }) =>
      (event: React.MouseEvent<HTMLElement, MouseEvent>) =>
        set(albumContextState, {
          data: group.key,
          spot: { left: event.clientX + 14, top: event.clientY },
        }),
  );

  return (
    <Stack horizontal verticalAlign="center">
      <IconButton
        iconProps={{
          iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={onHeaderExpanderClick}
      />
      <Stack
        horizontal
        verticalAlign="center"
        onDoubleClick={onAddSongsClick}
        onContextMenu={onRightClick}
        style={{ padding: '2px 0px', cursor: 'pointer' }}
      >
        <Image
          imageFit={ImageFit.centerContain}
          height={50}
          width={50}
          src={picurl}
        />
        <Text style={{ margin: '4px' }}>
          {`${albumData.album}: ${albumData.artist} ` +
            (album.year > 0 ? `[${albumData.year}] ` : '') +
            (album.songs.length === 1
              ? '1 song'
              : `${album.songs.length} songs`)}
        </Text>
      </Stack>
    </Stack>
  );
}

export function GroupedAlbumList(): JSX.Element {
  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);

  const albums = useRecoilValue(allAlbumsFunc);
  const ignoreArticles = useRecoilValue(ignoreArticlesState);
  const keyBuffer = useRecoilValue(focusedKeysFuncFam(CurrentView.album));
  const allSongs = useRecoilValue(allSongsFunc);
  const allArtists = useRecoilValue(allArtistsFunc);
  const newAlbumSort = useRecoilValue(albumSortState);
  const albumContext = useRecoilValue(albumContextState);

  const curExpandedState = useRecoilState(albumExpandedState);
  const [curSort, setSort] = useRecoilState(albumSortState);
  const resetAlbumContext = useResetRecoilState(albumContextState);

  const onAddSongClick = useMyTransaction(
    (xact) => (item: Song) => AddSongs(xact, [item.key]),
  );
  const onRightClick = useMyTransaction(
    ({ set }) =>
      (item: Song, _index?: number, ev?: Event) => {
        if (
          !Type.isUndefined(ev) &&
          Type.hasType(ev, 'clientX', Type.isNumber) &&
          Type.hasType(ev, 'clientY', Type.isNumber)
        ) {
          set(albumContextState, {
            data: item.key,
            spot: { left: ev.clientX + 14, top: ev.clientY },
          });
        }
      },
  );

  // Get the sorted song & group lists
  const { songs: sortedSongs, groups } = SortSongsFromAlbums(
    albums.values(),
    allSongs,
    allArtists,
    ignoreArticles,
    newAlbumSort,
  );
  const [columns, groupProps] = ProcessSongGroupData(
    groups,
    curExpandedState,
    'albumId',
    [
      ['l', 'albumId', 'Album', 50, 175, AlbumForSongRender],
      ['r', 'primaryArtists', 'Artist', 50, 250, ArtistsForSongRender],
      ['y', 'albumId', 'Year', 45, 45, YearForSongRender],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    (group: IGroup) => <AlbumHeaderDisplay group={group} />,
    () => curSort,
    setSort,
  );

  // This doesn't quite work: It's sometimes off by a few rows.
  // It looks like DetailsList doesn't do the math quite right, unfortunately.
  // I should check it out on Songs to see if it's related to groups...
  if (detailRef && keyBuffer.length > 0) {
    const index = GetIndexOf(
      groups,
      keyBuffer,
      (s: IGroup) => s.name,
      ignoreArticles ? noArticlesCmp : articlesCmp,
    );
    detailRef.focusIndex(index);
  }

  return (
    <div className="songListForAlbum" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          componentRef={(ref) => setDetailRef(ref)}
          items={sortedSongs}
          selectionMode={SelectionMode.none}
          groups={groups}
          columns={columns}
          compact
          onRenderRow={altRowRenderer()}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={onRightClick}
          onItemInvoked={onAddSongClick}
          groupProps={groupProps}
        />
        <SongListMenu
          context={albumContext}
          onClearContext={resetAlbumContext}
          onGetSongList={(xact: MyTransactionInterface, data: string) =>
            SongListFromKey(xact, data)
          }
        />
      </ScrollablePane>
    </div>
  );
}
