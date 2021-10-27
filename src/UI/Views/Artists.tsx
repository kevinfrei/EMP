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
import { MakeError } from '@freik/core-utils';
import { Album, AlbumKey, Artist, ArtistKey } from '@freik/media-core';
import { useState } from 'react';
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';
import {
  AddSongs,
  MyTransactionInterface,
  SongListFromKey,
  useMyTransaction,
} from '../../Recoil/api';
import { MakeSetState } from '../../Recoil/helpers';
import { artistImageUrlFuncFam, focusedKeysFuncFam } from '../../Recoil/Local';
import {
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  artistByKeyFuncFam,
} from '../../Recoil/ReadOnly';
import {
  CurrentView,
  ignoreArticlesState,
  minSongCountForArtistListState,
  showArtistsWithFullAlbumsState,
} from '../../Recoil/ReadWrite';
import {
  articlesCmp,
  ArtistSong,
  MakeSortKey,
  noArticlesCmp,
  SortSongsFromArtists,
} from '../../Sorting';
import { GetIndexOf } from '../../Tools';
import {
  AlbumForSongRender,
  ArtistNameFromArtistIds,
  YearForSongRender,
} from '../SimpleTags';
import {
  altRowRenderer,
  ProcessSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import './styles/Artists.css';

const err = MakeError('Artists-err'); // eslint-disable-line

// This is used to trigger the popup menu in the list view
const artistContextState = atom<SongListMenuData>({
  key: 'artistContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

const [artistExpandedState, artistIsExpandedState] =
  MakeSetState<ArtistKey>('artistExpanded');

// For grouping to work properly, the sort order needs to be fully specified
const sortOrderState = atom({
  key: 'artistsSortOrder',
  default: MakeSortKey(['r', ''], ['r', 'ylnt']),
});

function ArtistHeaderDisplay({ group }: { group: IGroup }): JSX.Element {
  const artist = useRecoilValue(artistByKeyFuncFam(group.key));
  const picurl = useRecoilValue(artistImageUrlFuncFam(group.key));
  const onAddSongsClick = useMyTransaction((xact) => () => {
    AddSongs(xact, artist.songs);
  });
  const onHeaderExpanderClick = useMyTransaction(
    ({ set }) =>
      () =>
        set(artistIsExpandedState(group.key), !group.isCollapsed),
  );
  const onRightClick = useMyTransaction(
    ({ set }) =>
      (event: React.MouseEvent<HTMLElement, MouseEvent>) =>
        set(artistContextState, {
          data: artist.key,
          spot: { left: event.clientX + 14, top: event.clientY },
        }),
  );
  const songCount = artist.songs.length;
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
          {`${artist.name}: ${songCount} Song${songCount > 1 ? 's' : ''}`}
        </Text>
      </Stack>
    </Stack>
  );
}

function getFilteredArtists(
  fullAlbums: boolean,
  minSongCount: number,
  artists: Map<ArtistKey, Artist>,
  albums: Map<AlbumKey, Album>,
): Artist[] {
  const result = [...artists.values()];
  if (fullAlbums) {
    // Filter down to artists that have at least one album where
    // they are the primary artist
    return result.filter((artist) => {
      for (const lKey of artist.albums) {
        const album = albums.get(lKey);
        if (album && album.primaryArtists.indexOf(artist.key) >= 0) {
          return true;
        }
      }
      return false;
    });
  } else if (minSongCount > 1) {
    // Filter down to artists than have a minimum number of songs
    return result.filter((artist) => artist.songs.length >= minSongCount);
  }
  return result;
}

export function GroupedAristList(): JSX.Element {
  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);

  const artists = useRecoilValue(allArtistsFunc);
  const albums = useRecoilValue(allAlbumsFunc);
  const songs = useRecoilValue(allSongsFunc);
  const ignoreArticles = useRecoilValue(ignoreArticlesState);
  const fullAlbums = useRecoilValue(showArtistsWithFullAlbumsState);
  const minSongCount = useRecoilValue(minSongCountForArtistListState);
  const keyBuffer = useRecoilValue(focusedKeysFuncFam(CurrentView.artist));
  const artistContext = useRecoilValue(artistContextState);

  const [curSort, setSort] = useRecoilState(sortOrderState);
  const curExpandedState = useRecoilState(artistExpandedState);
  const resetArtistContext = useResetRecoilState(artistContextState);

  const onRightClick = useMyTransaction(
    ({ set }) =>
      (item: ArtistSong, _index?: number, ev?: Event) => {
        if (ev) {
          const event = ev as any as MouseEvent;
          set(artistContextState, {
            data: item.key,
            spot: { left: event.clientX + 14, top: event.clientY },
          });
        }
      },
  );
  const onAddSongClick = useMyTransaction(
    (xact) => (item: ArtistSong) => AddSongs(xact, [item.key]),
  );

  const filteredArtistsFromSongRenderer = (
    theSong: ArtistSong,
  ): JSX.Element => (
    <ArtistNameFromArtistIds artistIds={[theSong.sortedArtistId]} />
  );
  const { songs: sortedSongs, groups } = SortSongsFromArtists(
    getFilteredArtists(fullAlbums, minSongCount, artists, albums),
    artists,
    albums,
    songs,
    ignoreArticles,
    curSort,
  );
  const [columns, groupProps] = ProcessSongGroupData(
    groups,
    curExpandedState,
    'sortedArtistId',
    [
      [
        'r',
        'sortedArtistId',
        'Artist',
        50,
        175,
        filteredArtistsFromSongRenderer,
      ],
      ['l', 'albumId', 'Album', 50, 175, AlbumForSongRender],
      ['y', 'albumId', 'Year', 45, 45, YearForSongRender],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    (group: IGroup) => <ArtistHeaderDisplay group={group} />,
    () => curSort,
    setSort,
  );

  // This doesn't quite work.
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
    <div className="artistView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          columns={columns}
          compact
          componentRef={(ref) => setDetailRef(ref)}
          selectionMode={SelectionMode.none}
          items={sortedSongs}
          groups={groups}
          groupProps={groupProps}
          onItemContextMenu={onRightClick}
          onItemInvoked={onAddSongClick}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onRenderRow={altRowRenderer()}
        />
        <SongListMenu
          context={artistContext}
          onClearContext={resetArtistContext}
          onGetSongList={(xact: MyTransactionInterface, data: string) =>
            SongListFromKey(xact, data)
          }
        />
      </ScrollablePane>
    </div>
  );
}
