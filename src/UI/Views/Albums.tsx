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
import { MakeLogger } from '@freik/core-utils';
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
import { keyFilterAtom, songDetailAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
  dataForAlbumSel,
} from '../../Recoil/ReadOnly';
import {
  CurrentView,
  curViewAtom,
  ignoreArticlesAtom,
} from '../../Recoil/ReadWrite';
import { noArticles, SortSongs } from '../../Tools';
import {
  AlbumFromSong,
  altRowRenderer,
  ArtistsFromSong,
  getIndexOf,
  GetSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/Albums.css';

const log = MakeLogger('Albums', true);

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

const sortOrderAtom = atom({ key: 'albumsSortOrder', default: 'l' });
const sortedSongsSel = selector({
  key: 'albumsSorted',
  get: ({ get }) => {
    return SortSongs(
      get(sortOrderAtom),
      [...get(allSongsSel).values()],
      get(allAlbumsSel),
      get(allArtistsSel),
      get(ignoreArticlesAtom),
    );
  },
});

export default function AlbumList(): JSX.Element {
  const albums = useRecoilValue(allAlbumsSel);
  const keyFilter = useRecoilValue(keyFilterAtom);
  const sortedSongs = useRecoilValue(sortedSongsSel);
  const ignoreArticles = useRecoilValue(ignoreArticlesAtom);
  const curView = useRecoilValue(curViewAtom);

  const [curSort, setSort] = useRecoilState(sortOrderAtom);

  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailAtom, item),
  );
  const onAddSongClick = useRecoilCallback((cbInterface) => (item: Song) =>
    AddSongs([item.key], cbInterface),
  );

  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);
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

  // This doesn't quite work. I should check it out on Songs to see if it's
  // related to groups...
  if (curView === CurrentView.album && detailRef && keyFilter.length > 0) {
    const index = getIndexOf<IGroup>(groups, keyFilter, (s: IGroup) =>
      ignoreArticles ? noArticles(s.name) : s.name,
    );
    detailRef.focusIndex(index);
    /*
    log(`Filter: '${keyFilter}' index: ${index} name: ${groups[index].name}`);
    log(`Start Item: ${detailRef.getStartItemIndexInView()}`);
    */
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
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={onAddSongClick}
          groupProps={groupProps}
        />
      </ScrollablePane>
    </div>
  );
}
