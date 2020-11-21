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
import { Artist, ArtistKey, Song, SongKey } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import {
  atom,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import {
  DataForSongGetter,
  GetArtistString,
  GetArtistStringFromKeys,
  GetDataForSong,
  SongData,
} from '../../DataSchema';
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
  ArtistName,
  GetSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/Artists.css';

export function ArtistHeaderDisplay(props: { artists: Artist[] }): JSX.Element {
  const onAddSongsClick = useRecoilCallback(({ set }) => () =>
    props.artists.forEach((art) => AddSongs(art.songs, set)),
  );
  const name = GetArtistString(props.artists);
  let songCount = 0;
  if (props.artists.length === 1) {
    songCount = props.artists[0].songs.length;
  } else {
    // To count the songs, find the intersection of each artist
    let songSet = new Set<SongKey>(props.artists[0].songs);
    for (let i = 2; songSet.size > 0 && i < props.artists.length; i++) {
      const newSongSet = new Set<SongKey>();
      for (const songKey of props.artists[i].songs) {
        if (songSet.has(songKey)) {
          newSongSet.add(songKey);
        }
      }
      songSet = newSongSet;
    }
    songCount = songSet.size;
  }
  return (
    <Text onDoubleClick={onAddSongsClick}>
      {`${name}: ${songCount} Song${songCount > 1 ? 's' : ''}`}
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
    // Create the set of artists to filter down to
    const filteredArtistSet = new Set(
      get(filteredArtistsSel).map((r) => r.key),
    );
    // This makes an artist string with only the filtered artists
    const getArtistString = (
      ids: ArtistKey[],
      lookup: Map<ArtistKey, Artist>,
    ): string =>
      GetArtistStringFromKeys(
        ids.filter((id) => filteredArtistSet.has(id)),
        lookup,
      );
    // Get song data using the our filtered string functions
    const getFilteredSongData: DataForSongGetter = (
      song,
      allAlbums,
      allArtists,
    ): SongData => GetDataForSong(song, allAlbums, allArtists, getArtistString);
    return SortSongs(
      get(sortOrderAtom),
      get(filteredSongsSel),
      get(allAlbumsSel),
      get(allArtistsSel),
      get(ignoreArticlesAtom),
      getFilteredSongData,
    );
  },
});

export default function ArtistList(): JSX.Element {
  const filteredArtistList = useRecoilValue(filteredArtistsSel);
  const artists = new Map(filteredArtistList.map((r) => [r.key, r]));
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

  const filteredArtistsFromSong = (theSong: Song): JSX.Element => (
    <ArtistName artistIds={theSong.artistIds.filter((v) => artists.has(v))} />
  );
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
    (s: Song) => s.artistIds.filter((v) => artists.has(v)).join(';'),
    (s: string) => GetArtistStringFromKeys(s.split(';'), artists) || '',
    'r',
    'artistIds',
    [
      ['r', 'artistIds', 'Artist', 50, 175, filteredArtistsFromSong],
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
