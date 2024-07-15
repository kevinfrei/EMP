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
import { Album, AlbumKey, Artist, ArtistKey } from '@freik/media-core';
import { MyTransactionInterface } from '@freik/web-utils';
import { atom as jatom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useJotaiCallback } from '../../Jotai/Helpers';
import { MakeSetAtomFamily } from '../../Jotai/Hooks';
import { focusedKeysFuncFam } from '../../Jotai/KeyBuffer';
import { ignoreArticlesState } from '../../Jotai/SimpleSettings';
import { SongListFromKey } from '../../Recoil/api';
import {
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  artistByKeyFuncFam,
  filteredArtistsFunc,
} from '../../Recoil/ReadOnly';
import {
  articlesCmp,
  ArtistSong,
  MakeSortKey,
  noArticlesCmp,
  SortSongsFromArtists,
} from '../../Sorting';
import { getArtistImageUrl, GetIndexOf } from '../../Tools';
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

import { MakeLog } from '@freik/logger';
import { AddSongs } from '../../Jotai/API';
import './styles/Artists.css';

const { wrn } = MakeLog('EMP:render:Artists');
wrn.enabled = true;

// This is used to trigger the popup menu in the list view
const artistContextState = atomWithReset<SongListMenuData>({
  data: '',
  spot: { left: 0, top: 0 },
});

const [artistExpandedState, artistIsExpandedState] =
  MakeSetAtomFamily<ArtistKey>();

// For grouping to work properly, the sort order needs to be fully specified
const sortOrderState = jatom(MakeSortKey(['r', ''], ['r', 'ylnt']));

function ArtistHeaderDisplay({ group }: { group: IGroup }): JSX.Element {
  const expansionState = artistIsExpandedState(group.key);
  const artist = useRecoilValue(artistByKeyFuncFam(group.key));
  const picurl = getArtistImageUrl(group.key);
  const setArtistContext = useSetAtom(artistContextState);
  const onAddSongsClick = useCallback(() => {
    AddSongs(artist.songs).catch(wrn);
  }, [artist.songs]);
  const onHeaderExpanderClick = useJotaiCallback(
    (get, set) => set(expansionState, !group.isCollapsed),
    [expansionState, group.isCollapsed],
  );
  const onRightClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) =>
    setArtistContext({
      data: artist.key,
      spot: { left: event.clientX + 14, top: event.clientY },
    });
  const songCount = artist.songs.length;
  return (
    <div className="artist-header" onContextMenu={onRightClick}>
      <IconButton
        iconProps={{
          iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={onHeaderExpanderClick}
      />
      <div
        className="artist-header-info"
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
  const ignoreArticles = useAtomValue(ignoreArticlesState);
  const keyBuffer = useAtomValue(focusedKeysFuncFam(CurrentView.artists));
  const [artistContext, setArtistContext] = useAtom(artistContextState);
  const filteredArtists = useRecoilValue(filteredArtistsFunc);
  const [curSort, setSort] = useAtom(sortOrderState);
  const curExpandedState = useAtom(artistExpandedState);
  const resetArtistContext = useResetAtom(artistContextState);

  const onRightClick = (item: ArtistSong, _index?: number, ev?: Event) => {
    if (ev) {
      const event = ev as any as MouseEvent;
      setArtistContext({
        data: item.key,
        spot: { left: event.clientX + 14, top: event.clientY },
      });
    }
  };
  const onAddSongClick = useCallback(
    (item: ArtistSong) => AddSongs([item.key]),
    [],
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
