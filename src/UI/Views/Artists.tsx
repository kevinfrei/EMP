import {
  DetailsList,
  IconButton,
  IDetailsGroupRenderProps,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Stack,
  Text,
} from '@fluentui/react';
import { Artist, ArtistKey, MakeError, Song, Type } from '@freik/core-utils';
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
import { AddSongs } from '../../Recoil/api';
import {
  allAlbumsState,
  allArtistsState,
  allSongsState,
  getArtistByKeyFamily,
} from '../../Recoil/ReadOnly';
import {
  ignoreArticlesState,
  minSongCountForArtistListState,
  showArtistsWithFullAlbumsState,
} from '../../Recoil/ReadWrite';
import { MakeSongComparator, SortItems } from '../../Tools';
import { SongDetailContextMenuClick } from '../DetailPanel/Clickers';
import {
  AlbumFromSongRender,
  altRowRenderer,
  ArtistName,
  GetSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import './styles/Artists.css';

const err = MakeError('Artists-err'); // eslint-disable-line

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
  const onAddSongsClick = useRecoilCallback((cbInterface) => () =>
    AddSongs(cbInterface, artist.songs),
  );
  const onRightClick = useRecoilCallback(
    ({ set }) => (event: React.MouseEvent<HTMLElement, MouseEvent>) =>
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
const sortOrderState = atom({ key: 'artistsSortOrder', default: 'rylnt' });
const sortedSongsState = selector({
  key: 'artistsSorted',
  get: ({ get }) => {
    const artists = get(allArtistsState);
    return SortItems(
      get(filteredSongsState),
      MakeSongComparator(
        get(allAlbumsState),
        artists,
        get(ignoreArticlesState),
        get(sortOrderState),
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
  const [artistContext, setArtistContext] = useRecoilState(artistContextState);

  const filteredArtistList = useRecoilValue(filteredArtistsState);
  const artists = new Map(filteredArtistList.map((r) => [r.key, r]));
  const onSongDetailClick = useRecoilCallback(SongDetailContextMenuClick);
  const onAddSongClick = useRecoilCallback((cbInterface) => (item: Song) =>
    AddSongs(cbInterface, [item.key]),
  );

  const [curSort, setSort] = useRecoilState(sortOrderState);
  const curExpandedState = useState(new Set<ArtistKey>());

  const sortedSongs = useRecoilValue(sortedSongsState);

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
      ['l', 'albumId', 'Album', 50, 175, AlbumFromSongRender],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    () => curSort,
    setSort,
  );
  groupProps.onRenderHeader = renderArtistHeader;
  return (
    <div className="artistView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          compact
          onRenderRow={altRowRenderer()}
          selectionMode={SelectionMode.none}
          items={sortedSongs}
          getKey={(item: any, index?: number) => (item as ArtistSong).comboKey}
          groups={artistGroups}
          groupProps={groupProps}
          columns={columns}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={onAddSongClick}
        />
        <SongListMenu
          context={artistContext}
          onClearContext={() =>
            setArtistContext({ data: '', spot: { left: 0, top: 0 } })
          }
          onGetSongList={(cbInterface: CallbackInterface, data: string) => {
            const alb = cbInterface.snapshot
              .getLoadable(getArtistByKeyFamily(data))
              .valueMaybe();
            return alb ? alb.songs : undefined;
          }}
        />
      </ScrollablePane>
    </div>
  );
}
