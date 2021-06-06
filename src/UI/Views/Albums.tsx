import {
  DetailsList,
  IconButton,
  IDetailsGroupRenderProps,
  Image,
  ImageFit,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Stack,
  Text,
} from '@fluentui/react';
import { MakeError, MakeLogger } from '@freik/core-utils';
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
import { albumCoverUrlFamily } from '../../Recoil/Local';
import {
  allAlbumsState,
  allArtistsState,
  allSongsState,
  getDataForAlbumFamily,
} from '../../Recoil/ReadOnly';
import { ignoreArticlesState } from '../../Recoil/ReadWrite';
import { MakeSortKey, SortSongList } from '../../Sorting';
import {
  AlbumFromSongRender,
  altRowRenderer,
  ArtistsFromSongRender,
  GetSongGroupData,
  HeaderExpanderClick,
  StickyRenderDetailsHeader,
  YearFromSongRender,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import './styles/Albums.css';

const err = MakeError('Albums-err'); // eslint-disable-line
const log = MakeLogger('Albums'); // eslint-disable-line

const albumContextState = atom<SongListMenuData>({
  key: 'albumContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

export function AlbumHeaderDisplay(props: { album: Album }): JSX.Element {
  const albumData = useRecoilValue(getDataForAlbumFamily(props.album.key));
  const onAddSongsClick = useRecoilCallback((cbInterface) => async () => {
    await AddSongs(cbInterface, props.album.songs);
  });
  const onRightClick = useRecoilCallback(
    ({ set }) =>
      (event: React.MouseEvent<HTMLElement, MouseEvent>) =>
        set(albumContextState, {
          data: props.album.key,
          spot: { left: event.clientX + 14, top: event.clientY },
        }),
  );
  const picurl = useRecoilValue(albumCoverUrlFamily(props.album.key));
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
      <Text
        style={{ margin: '4px' }}
      >{`${albumData.album} - ${albumData.year} [${albumData.artist}]`}</Text>
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

export default function AlbumList(): JSX.Element {
  const [albumContext, setAlbumContext] = useRecoilState(albumContextState);
  const albums = useRecoilValue(allAlbumsState);
  const sortedSongs = useRecoilValue(sortedSongsState);

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

  const curExpandedState = useState(new Set<AlbumKey>());

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
          onClick={() => HeaderExpanderClick(props, curExpandedState)}
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
      ['l', 'albumId', 'Album', 50, 175, AlbumFromSongRender],
      ['r', 'primaryArtists', 'Artist', 50, 250, ArtistsFromSongRender],
      ['y', 'albumId', 'Year', 45, 45, YearFromSongRender],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    () => curSort,
    setSort,
  );
  groupProps.onRenderHeader = renderAlbumHeader;

  return (
    <div className="songListForAlbum" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
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
