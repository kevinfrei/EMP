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
import { Artist, ArtistKey, Song } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import {
  atom,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { GetArtistString, GetArtistStringFromKeys } from '../../DataSchema';
import { AddSongs } from '../../Recoil/api';
import { songDetailAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
} from '../../Recoil/ReadOnly';
import {
  ignoreArticlesAtom,
  minSongCountForArtistListAtom,
  showArtistsWithFullAlbumsAtom,
} from '../../Recoil/ReadWrite';
import { SortSongs } from '../../Tools';
import {
  AlbumFromSong,
  ArtistsFromSong,
  GetSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/Artists.css';

export function ArtistHeaderDisplay(props: { artists: Artist[] }): JSX.Element {
  const onAddSongsClick = useRecoilCallback(({ set }) => () =>
    props.artists.forEach((art) => AddSongs(art.songs, set)),
  );
  const name = GetArtistString(props.artists);
  const songCount = props.artists.reduce<number>(
    (prev: number, cur: Artist) => prev + cur.songs.length,
    0,
  );
  return (
    <Stack horizontal verticalAlign="center" onDoubleClick={onAddSongsClick}>
      <Text>{`${name} [${songCount} song${songCount > 1 ? 's' : ''}]`}</Text>
    </Stack>
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

const filteredSongsSel = selector<Song[]>({
  key: 'filteredSongs',
  get: ({ get }) => {
    const fullAlbums = get(showArtistsWithFullAlbumsAtom);
    const minSongCount = get(minSongCountForArtistListAtom);
    const songs = get(allSongsSel);
    if (!fullAlbums && minSongCount < 2) {
      return [...songs.values()];
    }
    // Get the list of artists we're including
    const artists = get(filteredArtistsSel);
    const songSet = new Set<Song>();
    artists.forEach((artist) => {
      artist.songs.forEach((sng) => {
        const song = songs.get(sng);
        if (song) {
          songSet.add(song);
        }
      });
    });
    return [...songSet];
  },
});

const sortOrderAtom = atom({ key: 'artistsSortOrder', default: 'r' });
const sortedSongsSel = selector({
  key: 'artistsSorted',
  get: ({ get }) => {
    return SortSongs(
      get(sortOrderAtom),
      get(filteredSongsSel),
      get(allAlbumsSel),
      get(allArtistsSel),
      get(ignoreArticlesAtom),
    );
  },
});

export default function ArtistList(): JSX.Element {
  const artists = useRecoilValue(allArtistsSel);
  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailAtom, item),
  );
  const onAddSongClick = useRecoilCallback(({ set }) => (item: Song) =>
    AddSongs([item.key], set),
  );

  const [curSort, setSort] = useRecoilState(sortOrderAtom);
  const curExpandedState = useState(new Set<ArtistKey>());
  const sortedSongs = useRecoilValue(sortedSongsSel);
  const performSort = (srt: string) => {
    if (srt !== curSort) {
      setSort(srt);
    }
  };

  const renderArtistHeader: IDetailsGroupRenderProps['onRenderHeader'] = (
    props,
  ) => {
    if (!props) return null;
    const artistKeys = props.group?.key;
    if (!artistKeys) return null;
    const artistList = artistKeys
      .split(';')
      .map((ak) => artists.get(ak)!)
      .filter((ak) => !!ak);
    if (!artistList) return null;
    return (
      <Stack horizontal verticalAlign="center">
        <IconButton
          iconProps={{
            iconName: props.group?.isCollapsed ? 'ChevronRight' : 'ChevronDown',
          }}
          onClick={() => props.onToggleCollapse!(props.group!)}
        />
        <ArtistHeaderDisplay artists={artistList} />
      </Stack>
    );
  };
  const [columns, artistGroups, groupProps] = GetSongGroupData(
    sortedSongs,
    curExpandedState,
    (s: Song) => s.artistIds.join(';'),
    (s: string) => GetArtistStringFromKeys(s.split(';'), artists) || '',
    'r',
    'artistIds',
    [
      ['r', 'artistIds', 'Artist', 50, 175, ArtistsFromSong],
      ['l', 'albumId', 'Album', 50, 175, AlbumFromSong],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    () => curSort,
    performSort,
  );
  groupProps.onRenderHeader = renderArtistHeader;
  return (
    <div className="artistView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          compact={true}
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
