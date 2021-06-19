import {
  DetailsList,
  IconButton,
  IDetailsGroupRenderProps,
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
import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { Album, AlbumKey, Song } from '@freik/media-core';
import { useState } from 'react';
import {
  atom,
  CallbackInterface,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';
import { AddSongs, SongListFromKey } from '../../Recoil/api';
import { MakeSetState } from '../../Recoil/helpers';
import { albumCoverUrlFamily, keyBufferState } from '../../Recoil/Local';
import {
  allAlbumsState,
  allArtistsState,
  allSongsState,
  getDataForAlbumFamily,
} from '../../Recoil/ReadOnly';
import {
  CurrentView,
  curViewState,
  ignoreArticlesState,
} from '../../Recoil/ReadWrite';
import {
  articlesCmp,
  MakeSortKey,
  noArticlesCmp,
  SortAlbumList,
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
const log = MakeLogger('Albums'); // eslint-disable-line

// This is used to trigger the popup menu in the list view
const albumContextState = atom<SongListMenuData>({
  key: 'albumContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

// For grouping to work properly, the sort order needs to be fully specified
// Also, the album year, VA type, and artist have to "stick" with the album name
// as a single group, or you get duplicate group IDs
const [albumExpandedState, albumIsExpandedState] =
  MakeSetState<AlbumKey>('albumExpanded');

// TODO: Fix this; It doesn't quite work properly
// Artist can sort both the album list and track list. The current abstraction
// doesn't support that concept very well...
const albumSortState = atom({
  key: 'newAlbumSort',
  default: MakeSortKey(['l', 'n'], ['lry', 'nrt']),
});

type AHDProps = { album: Album; group: IGroup };
export function AlbumHeaderDisplay({ album, group }: AHDProps): JSX.Element {
  const albumData = useRecoilValue(getDataForAlbumFamily(album.key));
  const picurl = useRecoilValue(albumCoverUrlFamily(album.key));
  const onAddSongsClick = useRecoilCallback((cbInterface) => async () => {
    await AddSongs(cbInterface, album.songs);
  });
  const onRightClick = useRecoilCallback(
    ({ set }) =>
      (event: React.MouseEvent<HTMLElement, MouseEvent>) =>
        set(albumContextState, {
          data: album.key,
          spot: { left: event.clientX + 14, top: event.clientY },
        }),
  );
  const onHeaderExpanderClick = useRecoilCallback(({ set }) => () => {
    set(albumIsExpandedState(group.key), !group.isCollapsed);
  });
  return (
    <Stack horizontal verticalAlign="center">
      <IconButton
        iconProps={{
          iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={() => onHeaderExpanderClick()}
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

  const albums = useRecoilValue(allAlbumsState);
  const curView = useRecoilValue(curViewState);
  const ignoreArticles = useRecoilValue(ignoreArticlesState);
  const keyBuffer = useRecoilValue(keyBufferState);
  const allSongs = useRecoilValue(allSongsState);
  const allArtists = useRecoilValue(allArtistsState);
  const newAlbumSort = useRecoilValue(albumSortState);
  const albumContext = useRecoilValue(albumContextState);

  const curExpandedState = useRecoilState(albumExpandedState);
  const [curSort, setSort] = useRecoilState(albumSortState);
  const resetAlbumContext = useResetRecoilState(albumContextState);

  const onAddSongClick = useRecoilCallback(
    (cbInterface) => async (item: Song) => {
      await AddSongs(cbInterface, [item.key]);
    },
  );
  const onRightClick = useRecoilCallback(
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

  const renderAlbumHeader: IDetailsGroupRenderProps['onRenderHeader'] = (
    props,
  ) => {
    return Type.isUndefined(props) || Type.isUndefined(props.group) ? null : (
      <AlbumHeaderDisplay
        album={albums.get(props.group.key)!}
        group={props.group}
      />
    );
  };
  const sortedAlbums = SortAlbumList(
    [...albums.values()],
    allArtists,
    ignoreArticles,
    newAlbumSort,
  );
  const { songs: sortedSongs, groups } = SortSongsFromAlbums(
    sortedAlbums,
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
    () => curSort,
    setSort,
  );
  groupProps.onRenderHeader = renderAlbumHeader;

  // This doesn't quite work: It's sometimes off by a few rows.
  // It looks like DetailsList doesn't do the math quite right, unfortunately.
  // I should check it out on Songs to see if it's related to groups...
  if (curView === CurrentView.album && detailRef && keyBuffer.length > 0) {
    const index = GetIndexOf(
      groups,
      keyBuffer,
      (s: IGroup) => (s ? s.name || '' : ''),
      ignoreArticles ? noArticlesCmp : articlesCmp,
    );
    detailRef.focusIndex(index);
    log(`"${keyBuffer}" index: ${index} name: ${groups[index].name}`);
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
          onClearContext={() => resetAlbumContext()}
          onGetSongList={(cbInterface: CallbackInterface, data: string) =>
            SongListFromKey(cbInterface, data)
          }
        />
      </ScrollablePane>
    </div>
  );
}
