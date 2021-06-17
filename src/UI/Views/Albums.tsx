import {
  DetailsList,
  IconButton,
  IDetailsGroupDividerProps,
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
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
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
  SortSongList,
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
  GetSongGroupData,
  MakeColumns,
  StickyRenderDetailsHeader,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import { LikeOrHate } from './MixedSongs';
import './styles/Albums.css';

const err = MakeError('Albums-err'); // eslint-disable-line
const log = MakeLogger('Albums'); // eslint-disable-line

const albumContextState = atom<SongListMenuData>({
  key: 'albumContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

export function AlbumHeaderDisplay({ album }: { album: Album }): JSX.Element {
  const albumData = useRecoilValue(getDataForAlbumFamily(album.key));
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
  const picurl = useRecoilValue(albumCoverUrlFamily(album.key));
  return (
    <Stack
      horizontal
      verticalAlign="center"
      onDoubleClick={onAddSongsClick}
      onContextMenu={onRightClick}
      style={{ padding: '2px 0px', cursor: 'pointer' }}
    >
      <Image
        src={picurl}
        height={50}
        width={50}
        imageFit={ImageFit.centerContain}
      />
      <Text style={{ margin: '4px' }}>
        {`${albumData.album}: ${albumData.artist} ` +
          (album.year > 0 ? `[${albumData.year}] ` : '') +
          (album.songs.length === 1 ? '1 song' : `${album.songs.length} songs`)}
      </Text>
    </Stack>
  );
}

// For grouping to work properly, the sort order needs to be fully specified
// Also, the album year, VA type, and artist have to "stick" with the album name
// as a single group, or you get duplicate group IDs
const sortOrderState = atom({
  key: 'albumSortOrder',
  default: MakeSortKey(['lyv', 'r', 'nt'], ['lyv', 'r', 'nt']),
});

const sortedSongsState = selector({
  key: 'albumsSorted',
  get: ({ get }) => {
    return SortSongList(
      [...get(allSongsState).values()],
      get(allAlbumsState),
      get(allArtistsState),
      get(ignoreArticlesState),
      get(sortOrderState),
    );
  },
});

const [albumExpandedState, albumIsExpandedState] =
  MakeSetState<AlbumKey>('albumExpanded');

export default function AlbumList(): JSX.Element {
  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);

  const albums = useRecoilValue(allAlbumsState);
  const curView = useRecoilValue(curViewState);
  const ignoreArticles = useRecoilValue(ignoreArticlesState);
  const keyBuffer = useRecoilValue(keyBufferState);
  const sortedSongs = useRecoilValue(sortedSongsState);

  const curExpandedState = useRecoilState(albumExpandedState);
  const [albumContext, setAlbumContext] = useRecoilState(albumContextState);
  const [curSort, setSort] = useRecoilState(sortOrderState);

  const onAddSongClick = useRecoilCallback(
    (cbInterface) => async (item: Song) => {
      await AddSongs(cbInterface, [item.key]);
    },
  );
  const onRightClick = useRecoilCallback(
    ({ set }) =>
      (item: Song, index?: number, ev?: Event) => {
        if (ev) {
          const event = ev as any as MouseEvent;
          set(albumContextState, {
            data: item.key,
            spot: { left: event.clientX + 14, top: event.clientY },
          });
        }
      },
  );
  const onHeaderExpanderClick = useRecoilCallback(
    ({ set }) =>
      ({ group, onToggleCollapse }: IDetailsGroupDividerProps) => {
        if (!Type.isUndefined(group)) {
          set(albumIsExpandedState(group.key), !group.key);
          if (!Type.isUndefined(onToggleCollapse)) {
            onToggleCollapse(group);
          }
        }
      },
  );

  const renderAlbumHeader: IDetailsGroupRenderProps['onRenderHeader'] = (
    props,
  ) => {
    if (Type.isUndefined(props) || Type.isUndefined(props.group)) return null;
    const albumId = props.group.key;
    return (
      <Stack horizontal verticalAlign="center">
        <IconButton
          iconProps={{
            iconName: props.group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
          }}
          onClick={() => onHeaderExpanderClick(props)}
        />
        <AlbumHeaderDisplay album={albums.get(albumId)!} />
      </Stack>
    );
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

  // This doesn't quite work.
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
          onClearContext={() =>
            setAlbumContext({ data: '', spot: { left: 0, top: 0 } })
          }
          onGetSongList={(cbInterface: CallbackInterface, data: string) =>
            SongListFromKey(cbInterface, data)
          }
        />
      </ScrollablePane>
    </div>
  );
}

const newAlbumSortState = atom({
  key: 'newAlbumSort',
  default: MakeSortKey(['lry', 'n'], ['lry', 'tnr']),
});

const sortedAlbumState = selector({
  key: 'sortedAlbums',
  get: ({ get }) => {
    return SortAlbumList(
      [...get(allAlbumsState).values()],
      get(allArtistsState),
      get(ignoreArticlesState),
      get(newAlbumSortState),
    );
  },
});

const sortedSongsFromAlbumsState = selector({
  key: 'songsFromAlbums',
  get: ({ get }) => {
    const res = SortSongsFromAlbums(
      get(sortedAlbumState),
      get(allSongsState),
      get(allArtistsState),
      get(ignoreArticlesState),
      get(newAlbumSortState),
    );
    res.groups.forEach((grp) => {
      grp.isCollapsed = !get(albumIsExpandedState(grp.key));
    });
    return res;
  },
});

export function GroupedAlbumList(): JSX.Element {
  const albums = useRecoilValue(allAlbumsState);
  const { songs: sortedSongs, groups } = useRecoilValue(
    sortedSongsFromAlbumsState,
  );
  const [sortOrder, setSortOrder] = useRecoilState(newAlbumSortState);
  const [, setExpandedSet] = useRecoilState(albumExpandedState);
  const columns = MakeColumns(
    [
      ['n', 'track', '#', 30, 30],
      ['r', 'artistIds', 'Artist(s)', 150, 450, ArtistsForSongRender],
      ['l', 'albumId', 'Album', 150, 450, AlbumForSongRender],
      ['y', 'albumId', 'Year', 45, 45, YearForSongRender],
      ['t', 'title', 'Title', 150],
      ['', '', '👎/👍', 35, 35, LikeOrHate],
    ],
    () => sortOrder,
    setSortOrder,
  );

  const groupProps: IDetailsGroupRenderProps = {
    onToggleCollapseAll: (isAllCollapsed: boolean) => {
      setExpandedSet(new Set<string>(isAllCollapsed ? [] : albums.keys()));
    },

    headerProps: {
      onToggleCollapse: useRecoilCallback(({ set }) => (group: IGroup) => {
        err('Collapsing');
        set(albumIsExpandedState(group.key), (curVal) => !curVal);
      }),
    },
  };
  return (
    <div className="newSongListForAlbum" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          items={sortedSongs}
          selectionMode={SelectionMode.none}
          groups={groups}
          columns={columns}
          compact
          onRenderRow={altRowRenderer()}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          groupProps={groupProps}
        />
      </ScrollablePane>
    </div>
  );
}
