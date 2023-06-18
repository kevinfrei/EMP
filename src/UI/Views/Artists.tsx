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
import { Album, AlbumKey, Artist, ArtistKey } from '@freik/media-core';
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
import { artistImageUrlFuncFam } from '../../Recoil/ImageUrls';
import { focusedKeysFuncFam } from '../../Recoil/KeyBuffer';
import {
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  artistByKeyFuncFam,
  filteredArtistsFunc,
} from '../../Recoil/ReadOnly';
import { ignoreArticlesState } from '../../Recoil/ReadWrite';
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
    <div className="artist-header">
      <IconButton
        iconProps={{
          iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={onHeaderExpanderClick}
      />
      <div
        className="artist-header-info"
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
      </div>
    </div>
  );
}

export function getFilteredArtists(
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
  const keyBuffer = useRecoilValue(focusedKeysFuncFam(CurrentView.artists));
  const artistContext = useRecoilValue(artistContextState);
  const filteredArtists = useRecoilValue(filteredArtistsFunc);
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
    filteredArtists,
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
      ['y', 'albumId', 'Year', 55, 25, YearForSongRender],
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
