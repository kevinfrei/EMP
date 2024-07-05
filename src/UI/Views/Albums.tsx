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
import { CurrentView } from '@freik/emp-shared';
import { AlbumKey, Song } from '@freik/media-core';
import { hasFieldType, isDefined, isNumber } from '@freik/typechk';
import {
  atom as jatom,
  useAtom,
  useAtomValue,
  useSetAtom,
  useStore,
} from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import { useState } from 'react';
import { AsyncHandler } from '../../Jotai/Helpers';
import { MakeSetAtomFamily } from '../../Jotai/Hooks';
import { AddSongs } from '../../Jotai/Interface';
import { focusedKeysFuncFam } from '../../Jotai/KeyBuffer';
import {
  albumByKeyFuncFam,
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  dataForAlbumFuncFam,
  SongListFromKey,
} from '../../Jotai/MusicDatabase';
import { ignoreArticlesState } from '../../Jotai/SimpleSettings';
import { MyStore } from '../../Jotai/Storage';
import {
  articlesCmp,
  MakeSortKey,
  noArticlesCmp,
  SortSongsFromAlbums,
} from '../../Sorting';
import { getAlbumImageUrl, GetIndexOf } from '../../Tools';
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
const albumContextState = atomWithReset<SongListMenuData>({
  data: '',
  spot: { left: 0, top: 0 },
});

const [albumExpandedState, albumIsExpandedState] =
  MakeSetAtomFamily<AlbumKey>();

// For grouping to work properly, the sort order needs to be fully specified
// Also, the album year, VA type, and artist have to "stick" with the album name
// as a single group, or you get duplicate group IDs
const albumSortState = jatom(MakeSortKey(['l', 'n'], ['lry', 'nrt']));

type AHDProps = { group: IGroup };
function AlbumHeaderDisplay({ group }: AHDProps): JSX.Element {
  const album = useAtomValue(albumByKeyFuncFam(group.key));
  const albumData = useAtomValue(dataForAlbumFuncFam(group.key));
  const picurl = getAlbumImageUrl(group.key);
  const store = useStore();
  const onAddSongsClick = AsyncHandler(async () => {
    await AddSongs(store, album.songs);
  });
  const onHeaderExpanderClick = () => {
    store.set(albumIsExpandedState(group.key), !group.isCollapsed);
  };
  const setAlbumContext = useSetAtom(albumContextState);
  const onRightClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const data = group.key;
    const spot = { left: event.clientX + 14, top: event.clientY };
    setAlbumContext({ data, spot });
  };

  return (
    <div className="album-header" onContextMenu={onRightClick}>
      <IconButton
        iconProps={{
          iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={onHeaderExpanderClick}
      />
      <div
        className="album-header-info"
        onDoubleClick={onAddSongsClick}
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

  const albums = useAtomValue(allAlbumsFunc);
  const ignoreArticles = useAtomValue(ignoreArticlesState);
  const keyBuffer = useAtomValue(focusedKeysFuncFam(CurrentView.albums));
  const allSongs = useAtomValue(allSongsFunc);
  const allArtists = useAtomValue(allArtistsFunc);
  const newAlbumSort = useAtomValue(albumSortState);
  const [albumContext, setAlbumContext] = useAtom(albumContextState);

  const curExpandedState = useAtom(albumExpandedState);
  const [curSort, setSort] = useAtom(albumSortState);
  const resetAlbumContext = useResetAtom(albumContextState);

  const store = useStore();
  const onAddSongClick = AsyncHandler(async (item: Song) => {
    await AddSongs(store, [item.key]);
  });
  const onRightClick = (item: Song, _index?: number, ev?: Event) => {
    if (
      isDefined(ev) &&
      hasFieldType(ev, 'clientX', isNumber) &&
      hasFieldType(ev, 'clientY', isNumber)
    ) {
      const data = item.key;
      const spot = { left: ev.clientX + 14, top: ev.clientY };
      setAlbumContext({ data, spot });
    }
  };
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
  const onGetSongList = (store: MyStore, data: string) =>
    store.get(SongListFromKey(data));
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
          onGetSongList={onGetSongList}
        />
      </ScrollablePane>
    </div>
  );
}
