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
  Text,
} from '@fluentui/react';
import { AlbumKey, Song } from '@freik/media-core';
import { hasFieldType, isDefined, isNumber } from '@freik/typechk';
import {
  MakeSetState,
  MyTransactionInterface,
  useMyTransaction,
} from '@freik/web-utils';
import { useState } from 'react';
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';
import { CurrentView } from '@freik/emp-shared';
import { AddSongs, SongListFromKey } from '../../Recoil/api';
import { albumCoverUrlFuncFam } from '../../Recoil/ImageUrls';
import { focusedKeysFuncFam } from '../../Recoil/KeyBuffer';
import {
  albumByKeyFuncFam,
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  dataForAlbumFuncFam,
} from '../../Recoil/ReadOnly';
import { ignoreArticlesState } from '../../Recoil/ReadWrite';
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
    <div className="album-header">
      <IconButton
        iconProps={{
          iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={onHeaderExpanderClick}
      />
      <div
        className="album-header-info"
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
      </div>
    </div>
  );
}

export function GroupedAlbumList(): JSX.Element {
  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);

  const albums = useRecoilValue(allAlbumsFunc);
  const ignoreArticles = useRecoilValue(ignoreArticlesState);
  const keyBuffer = useRecoilValue(focusedKeysFuncFam(CurrentView.albums));
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
          isDefined(ev) &&
          hasFieldType(ev, 'clientX', isNumber) &&
          hasFieldType(ev, 'clientY', isNumber)
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
      ['y', 'albumId', 'Year', 55, 25, YearForSongRender],
      ['n', 'track', '#', 15, 25],
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
