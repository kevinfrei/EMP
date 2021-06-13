import {
  DetailsList,
  IconButton,
  IDetailsGroupRenderProps,
  IDetailsList,
  IGroup,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Stack,
  Text,
} from '@fluentui/react';
import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { Artist, ArtistKey, Song } from '@freik/media-core';
import { useState } from 'react';
import {
  atom,
  CallbackInterface,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { GetArtistStringFromKeys } from '../../DataSchema';
import { AddSongs, SongListFromKey } from '../../Recoil/api';
import { keyBufferState } from '../../Recoil/Local';
import {
  allAlbumsState,
  allArtistsState,
  allSongsState,
} from '../../Recoil/ReadOnly';
import {
  CurrentView,
  curViewState,
  ignoreArticlesState,
  minSongCountForArtistListState,
  showArtistsWithFullAlbumsState,
} from '../../Recoil/ReadWrite';
import {
  articlesCmp,
  MakeSortKey,
  noArticlesCmp,
  SortItems,
} from '../../Sorting';
import { GetIndexOf } from '../../Tools';
import {
  AlbumFromSongRender,
  altRowRenderer,
  ArtistName,
  GetSongGroupData,
  HeaderExpanderClick,
  StickyRenderDetailsHeader,
  YearFromSongRender,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import './styles/Artists.css';

const err = MakeError('Artists-err'); // eslint-disable-line
const log = MakeLogger('Artists'); // eslint-disable-line

type ArtistSong = Song & { sortedArtistId: ArtistKey; comboKey: string };

const artistContextState = atom<SongListMenuData>({
  key: 'artistContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

export function ArtistHeaderDisplay({
  artist,
}: {
  artist: Artist;
}): JSX.Element {
  const onAddSongsClick = useRecoilCallback((cbInterface) => async () => {
    await AddSongs(cbInterface, artist.songs);
  });
  const onRightClick = useRecoilCallback(
    ({ set }) =>
      (event: React.MouseEvent<HTMLElement, MouseEvent>) =>
        set(artistContextState, {
          data: artist.key,
          spot: { left: event.clientX + 14, top: event.clientY },
        }),
  );
  const songCount = artist.songs.length;
  return (
    <Text
      onDoubleClick={onAddSongsClick}
      onContextMenu={onRightClick}
      style={{ cursor: 'pointer' }}
    >
      {`${artist.name}: ${songCount} Song${songCount > 1 ? 's' : ''}`}
    </Text>
  );
}

const filteredArtistsState = selector<Artist[]>({
  key: 'filteredArtists',
  get: ({ get }) => {
    const fullAlbums = get(showArtistsWithFullAlbumsState);
    const minSongCount = get(minSongCountForArtistListState);
    const artists = get(allArtistsState);
    const result: Artist[] = [];
    if (fullAlbums) {
      // Filter down to artists that have at least one album where
      // they are the primary artist
      const albums = get(allAlbumsState);
      artists.forEach((artist) => {
        for (const lKey of artist.albums) {
          const album = albums.get(lKey);
          if (!album) continue;
          if (album.primaryArtists.indexOf(artist.key) >= 0) {
            result.push(artist);
          }
        }
      });
    } else {
      if (minSongCount < 2) {
        return [...artists.values()];
      }
      // Filter down to artists than have a minimum number of songs
      artists.forEach((artist) => {
        if (artist.songs.length >= minSongCount) {
          result.push(artist);
        }
      });
    }
    return result;
  },
});

const filteredSongsState = selector<ArtistSong[]>({
  key: 'filteredSongs',
  get: ({ get }) => {
    const songs = get(allSongsState);
    // Get the list of artists we're including
    const artists = get(filteredArtistsState);
    // This needs to be a map, because sets are reference equality only...
    const songSet = new Map<string, ArtistSong>();
    artists.forEach((artist) => {
      artist.songs.forEach((sng) => {
        const song = songs.get(sng);
        if (song) {
          const comboKey = `${song.key};${artist.key}`;
          songSet.set(comboKey, {
            sortedArtistId: artist.key,
            comboKey,
            ...song,
          });
        }
      });
    });
    return [...songSet.values()];
  },
});

// For grouping to work properly, the sort order needs to be fully specified
const sortOrderState = atom({
  key: 'artistsSortOrder',
  default: MakeSortKey(['r', ''], ['r', 'ylnt']),
});

const sortedSongsState = selector({
  key: 'artistsSorted',
  get: ({ get }) => {
    const artists = get(allArtistsState);
    return SortItems(
      get(filteredSongsState),
      get(sortOrderState).makeSongComparator(
        get(allAlbumsState),
        artists,
        get(ignoreArticlesState),
        (s: Song) => {
          if (Type.hasStr(s, 'sortedArtistId')) {
            const a = artists.get(s.sortedArtistId);
            if (a) {
              return a.name;
            }
          }
          return '???';
        },
      ),
    );
  },
});

export default function ArtistList(): JSX.Element {
  const curExpandedState = useState(new Set<ArtistKey>());
  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);

  const curView = useRecoilValue(curViewState);
  const filteredArtistList = useRecoilValue(filteredArtistsState);
  const ignoreArticles = useRecoilValue(ignoreArticlesState);
  const keyBuffer = useRecoilValue(keyBufferState);
  const sortedSongs = useRecoilValue(sortedSongsState);

  const [artistContext, setArtistContext] = useRecoilState(artistContextState);
  const [curSort, setSort] = useRecoilState(sortOrderState);

  const artists = new Map(filteredArtistList.map((r) => [r.key, r]));
  const onRightClick = useRecoilCallback(
    ({ set }) =>
      (item: Song, index?: number, ev?: Event) => {
        if (ev) {
          const event = ev as any as MouseEvent;
          set(artistContextState, {
            data: item.key,
            spot: { left: event.clientX + 14, top: event.clientY },
          });
        }
      },
  );
  const onAddSongClick = useRecoilCallback(
    (cbInterface) => async (item: Song) => {
      await AddSongs(cbInterface, [item.key]);
    },
  );
  const onClearKeyBuffer = useRecoilCallback(
    ({ reset }) =>
      () =>
        reset(keyBufferState),
  );

  const filteredArtistsFromSong = (theSong: ArtistSong): JSX.Element => (
    <ArtistName artistIds={[theSong.sortedArtistId]} />
  );
  const renderArtistHeader: IDetailsGroupRenderProps['onRenderHeader'] = (
    props,
  ) => {
    if (!props) return null;
    const artistKey = props.group?.key;
    if (!artistKey) return null;
    const artist = artists.get(artistKey);
    if (!artist) return null;
    return (
      <Stack horizontal verticalAlign="center">
        <IconButton
          iconProps={{
            iconName: props.group?.isCollapsed ? 'ChevronRight' : 'ChevronDown',
          }}
          onClick={() => HeaderExpanderClick(props, curExpandedState)}
        />
        <ArtistHeaderDisplay artist={artist} />
      </Stack>
    );
  };
  const [columns, artistGroups, groupProps] = GetSongGroupData(
    sortedSongs,
    curExpandedState,
    (s: ArtistSong) => s.sortedArtistId,
    (s: string) => GetArtistStringFromKeys([s], artists),
    'sortedArtistId',
    [
      ['r', 'sortedArtistId', 'Artist', 50, 175, filteredArtistsFromSong],
      ['l', 'albumId', 'Album', 50, 175, AlbumFromSongRender],
      ['y', 'albumId', 'Year', 45, 45, YearFromSongRender],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    () => curSort,
    setSort,
  );
  groupProps.onRenderHeader = renderArtistHeader;

  // This doesn't quite work.
  // It looks like DetailsList doesn't do the math quite right, unfortunately.
  // I should check it out on Songs to see if it's related to groups...
  if (curView === CurrentView.artist && detailRef && keyBuffer.length > 0) {
    const index = GetIndexOf(
      artistGroups,
      keyBuffer,
      (s: IGroup) => (s ? s.name || '' : ''),
      ignoreArticles ? noArticlesCmp : articlesCmp,
    );
    detailRef.focusIndex(index);
    setTimeout(onClearKeyBuffer, 1);
    log(
      `Filter: '${keyBuffer}' index: ${index} name: ${artistGroups[index].name}`,
    );
  }

  return (
    <div className="artistView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          compact
          componentRef={(ref) => setDetailRef(ref)}
          onRenderRow={altRowRenderer()}
          selectionMode={SelectionMode.none}
          items={sortedSongs}
          getKey={(item: any, index?: number) =>
            Type.hasStr(item, 'comboKey') ? item.comboKey : ''
          }
          groups={artistGroups}
          groupProps={groupProps}
          columns={columns}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={onRightClick}
          onItemInvoked={onAddSongClick}
        />
        <SongListMenu
          context={artistContext}
          onClearContext={() =>
            setArtistContext({ data: '', spot: { left: 0, top: 0 } })
          }
          onGetSongList={(cbInterface: CallbackInterface, data: string) =>
            SongListFromKey(cbInterface, data)
          }
        />
      </ScrollablePane>
    </div>
  );
}
