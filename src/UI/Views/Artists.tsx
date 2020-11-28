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
import { Type } from '@freik/core-utils';
import { Artist, ArtistKey, Song } from '@freik/media-utils';
import { useState } from 'react';
import {
  atom,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { GetArtistStringFromKeys } from '../../DataSchema';
import { AddSongs } from '../../Recoil/api';
import { keyFilterAtom, songDetailAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
} from '../../Recoil/ReadOnly';
import {
  CurrentView,
  curViewAtom,
  ignoreArticlesAtom,
  minSongCountForArtistListAtom,
  showArtistsWithFullAlbumsAtom,
} from '../../Recoil/ReadWrite';
import {
  GetIndexOf,
  MakeSongComparator,
  noArticles,
  SortItems,
} from '../../Tools';
import {
  AlbumFromSong,
  altRowRenderer,
  ArtistName,
  GetSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/Artists.css';

type ArtistSong = Song & { sortedArtistId: ArtistKey };

export function ArtistHeaderDisplay({
  artist,
}: {
  artist: Artist;
}): JSX.Element {
  const onAddSongsClick = useRecoilCallback((cbInterface) => () =>
    AddSongs(artist.songs, cbInterface),
  );
  const songCount = artist.songs.length;
  return (
    <Text onDoubleClick={onAddSongsClick}>
      {`${artist.name}: ${songCount} Song${songCount > 1 ? 's' : ''}`}
    </Text>
  );
}

const filteredArtistsSel = selector<Artist[]>({
  key: 'filteredArtists',
  get: ({ get }) => {
    const fullAlbums = get(showArtistsWithFullAlbumsAtom);
    const minSongCount = get(minSongCountForArtistListAtom);
    const artists = get(allArtistsSel);
    const result: Artist[] = [];
    if (fullAlbums) {
      // Filter down to artists that have at least one album where
      // they are the primary artist
      const albums = get(allAlbumsSel);
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

const filteredSongsSel = selector<ArtistSong[]>({
  key: 'filteredSongs',
  get: ({ get }) => {
    const songs = get(allSongsSel);
    // Get the list of artists we're including
    const artists = get(filteredArtistsSel);
    const songSet = new Set<ArtistSong>();
    artists.forEach((artist) => {
      artist.songs.forEach((sng) => {
        const song = songs.get(sng);
        if (song) {
          songSet.add({ sortedArtistId: artist.key, ...song });
        }
      });
    });
    return [...songSet];
  },
});

// For grouping to work properly, the sort order needs to be fully specified
const sortOrderAtom = atom({ key: 'artistsSortOrder', default: 'rylnt' });

const sortedSongsSel = selector({
  key: 'artistsSorted',
  get: ({ get }) => {
    // TODO: Fix this for the filtered songs
    const artists = get(allArtistsSel);
    return SortItems(
      get(filteredSongsSel),
      MakeSongComparator(
        get(allAlbumsSel),
        artists,
        get(ignoreArticlesAtom),
        get(sortOrderAtom),
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
  const filteredArtistList = useRecoilValue(filteredArtistsSel);
  const keyFilter = useRecoilValue(keyFilterAtom);
  const curView = useRecoilValue(curViewAtom);
  const ignoreArticles = useRecoilValue(ignoreArticlesAtom);
  const artists = new Map(filteredArtistList.map((r) => [r.key, r]));
  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailAtom, item),
  );
  const onAddSongClick = useRecoilCallback((cbInterface) => (item: Song) =>
    AddSongs([item.key], cbInterface),
  );

  const [curSort, setSort] = useRecoilState(sortOrderAtom);
  const curExpandedState = useState(new Set<ArtistKey>());
  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);

  const sortedSongs = useRecoilValue(sortedSongsSel);
  const performSort = (srt: string) => {
    if (srt !== curSort) {
      setSort(srt);
    }
  };

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
          onClick={() => props.onToggleCollapse!(props.group!)}
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
    'r',
    'sortedArtistId',
    [
      ['r', 'sortedArtistId', 'Artist', 50, 175, filteredArtistsFromSong],
      ['l', 'albumId', 'Album', 50, 175, AlbumFromSong],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    () => curSort,
    performSort,
  );
  groupProps.onRenderHeader = renderArtistHeader;
  if (curView === CurrentView.artist && detailRef && keyFilter.length > 0) {
    const index = GetIndexOf<IGroup>(artistGroups, keyFilter, (s: IGroup) =>
      ignoreArticles ? noArticles(s.name) : s.name,
    );
    detailRef.focusIndex(index);
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
          groups={artistGroups}
          groupProps={groupProps}
          columns={columns}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={onAddSongClick}
        />
      </ScrollablePane>
    </div>
  );
}
