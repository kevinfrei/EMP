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
import { MakeError } from '@freik/core-utils';
import { Album, AlbumKey, Song } from '@freik/media-utils';
import { useState } from 'react';
import {
  atom,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { AddSongs } from '../../Recoil/api';
import { songDetailAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
  dataForAlbumSel,
} from '../../Recoil/ReadOnly';
import { ignoreArticlesAtom } from '../../Recoil/ReadWrite';
import { SortSongList } from '../../Tools';
import {
  AlbumFromSong,
  altRowRenderer,
  ArtistsFromSong,
  GetSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/Albums.css';

const err = MakeError('Albums-err'); // eslint-disable-line

export function AlbumHeaderDisplay(props: { album: Album }): JSX.Element {
  const albumData = useRecoilValue(dataForAlbumSel(props.album.key));
  const onAddSongsClick = useRecoilCallback((cbInterface) => () =>
    AddSongs(props.album.songs, cbInterface),
  );
  return (
    <Stack
      horizontal
      verticalAlign="center"
      onDoubleClick={onAddSongsClick}
      style={{ padding: '2px 0px' }}
    >
      <Image
        src={`pic://album/${props.album.key}`}
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
const sortOrderAtom = atom({ key: 'albumsSortOrder', default: 'lyrnt' });
const sortedSongsSel = selector({
  key: 'albumsSorted',
  get: ({ get }) => {
    return SortSongList(
      [...get(allSongsSel).values()],
      get(allAlbumsSel),
      get(allArtistsSel),
      get(ignoreArticlesAtom),
      get(sortOrderAtom),
    );
  },
});

export default function AlbumList(): JSX.Element {
  const albums = useRecoilValue(allAlbumsSel);
  const sortedSongs = useRecoilValue(sortedSongsSel);

  const [curSort, setSort] = useRecoilState(sortOrderAtom);

  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailAtom, item),
  );
  const onAddSongClick = useRecoilCallback((cbInterface) => (item: Song) =>
    AddSongs([item.key], cbInterface),
  );

  const curExpandedState = useState(new Set<AlbumKey>());

  // This takes a sort string, shuffles it to always have the groupId first
  // then sorts according to the order specified
  const performSort = (srt: string) => {
    if (srt !== curSort) {
      setSort(srt);
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
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={onAddSongClick}
          groupProps={groupProps}
        />
      </ScrollablePane>
    </div>
  );
}
