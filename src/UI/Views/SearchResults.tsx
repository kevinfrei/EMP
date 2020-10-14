import {
  DetailsList,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Text,
} from '@fluentui/react';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { GetDataForSong, SongData } from '../../DataSchema';
import { SearchResults } from '../../ipc';
import { AddSongs } from '../../Recoil/api';
import { songDetailAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
  searchSel,
  searchTermAtom,
} from '../../Recoil/ReadOnly';
import { MakeColumns, StickyRenderDetailsHeader } from '../SongList';
import { ViewProps } from './Selector';
import './styles/SearchResults.css';

// const log = MakeLogger('SearchResults', true);

type SearchSongData = SongData & { key: string; group: string };

function AggregateSearchResults(
  songs: Map<SongKey, Song>,
  artists: Map<ArtistKey, Artist>,
  albums: Map<AlbumKey, Album>,
  searchResults: SearchResults,
) {
  function MakeSongSearchEntry(
    song: Song,
    index: number,
    group: string,
  ): SearchSongData {
    return {
      key: `${group}-${song.key}-${index}`,
      group,
      ...GetDataForSong(song, albums, artists),
    };
  }
  function MakeAlbumSongEntries(albumKey: AlbumKey): SearchSongData[] {
    const album = albums.get(albumKey);
    if (!album) return [];
    return album.songs.map((sk, idx) =>
      MakeSongSearchEntry(songs.get(sk)!, idx, `L-${album.key}`),
    );
  }
  function MakeArtistSongEntries(artistKey: ArtistKey): SearchSongData[] {
    const artist = artists.get(artistKey);
    if (!artist) return [];
    return artist.songs.map((sk, idx) => {
      const song = songs.get(sk);
      return MakeSongSearchEntry(
        song!,
        idx,
        `R-${artist.key}-${song!.albumId}`,
      );
    });
  }
  const results = searchResults.songs.map((songKey, index) =>
    MakeSongSearchEntry(songs.get(songKey)!, index, 'songs'),
  );
  searchResults.albums.forEach((l) => {
    results.push(...MakeAlbumSongEntries(l));
  });
  searchResults.artists.forEach((r) => {
    results.push(...MakeArtistSongEntries(r));
  });
  return results;
}

export default function SearchResultsView({ hidden }: ViewProps): JSX.Element {
  const searchTerm = useRecoilValue(searchTermAtom);
  const searchResults = useRecoilValue(searchSel(searchTerm));
  const songs = useRecoilValue(allSongsSel);
  const artists = useRecoilValue(allArtistsSel);
  const albums = useRecoilValue(allAlbumsSel);
  const onSongDetailClick = useRecoilCallback(
    ({ set }) => (item: SearchSongData) => set(songDetailAtom, item.song),
  );
  const onAddSongClick = useRecoilCallback(
    ({ set }) => (item: SearchSongData) => AddSongs([item.song.key], set),
  );
  if (
    !searchResults.albums.length &&
    !searchResults.songs.length &&
    !searchResults.artists.length
  ) {
    return (
      <div
        style={hidden ? { visibility: 'hidden' } : {}}
        className="current-view empty-results"
      >
        <Text>No results found</Text>
      </div>
    );
  }
  const resultEntries: SearchSongData[] = AggregateSearchResults(
    songs,
    artists,
    albums,
    searchResults,
  );
  //  log(resultEntries);
  // I need to create a group hierarchy like this:
  // Songs => Song Results
  // Artists => Artist List => Albums => Per Album Song Results
  // Albums => Album List => Per Album Song Results
  // To deal with that, I need unique keys for duplicate songs
  // the key should be : s<song>, r<artist><song>, l<album><song>
  // Sorting can't mess with the top level groups
  // We should start with Songs, Artist, and Albums expanded
  // which corresponds to the search results

  /*
  key: string;
  group string;
  song: Song;
  title: string;
  track: number;
  artist: string;
  album: string;
  year: number; // There are albums with the same name. Ties break by year,
  albumKey: string; // then by key.
  */
  const columns = MakeColumns(
    [
      ['', 'key', 'key', 50, 50],
      ['', 'group', 'gid', 50, 50],
      ['r', 'artist', 'Artist', 150, 450],
      ['l', 'album', 'Album', 150, 450],
      ['n', 'track', '#', 30, 30],
      ['t', 'title', 'Title', 150, 450],
    ],
    () => '',
    (srt) => '',
  );

  return (
    <div
      style={hidden ? { visibility: 'hidden' } : {}}
      className="current-view"
      data-is-scrollable="true"
    >
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          compact={true}
          selectionMode={SelectionMode.none}
          items={resultEntries}
          columns={columns}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={onAddSongClick}
        />
      </ScrollablePane>
    </div>
  );
}
