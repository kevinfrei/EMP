import {
  DetailsList,
  IconButton,
  IDetailsGroupRenderProps,
  IGroup,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Stack,
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
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
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
import {
  altRowRenderer,
  MakeColumns,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/SearchResults.css';

// const log = MakeLogger('SearchResults', true);

type SearchSongData = SongData & { key: string; group: string };

function MakeAlbumGroupKey(albumKey: AlbumKey): string {
  return `L*${albumKey}`;
}
/*
function GetAlbumGroup(groupKey: string): string | void {
  if (groupKey.startsWith('L*')) {
    return groupKey.substr(2);
  }
}
*/
function MakeArtistGroupKey(rk: ArtistKey, lk: AlbumKey): string {
  return `R*${rk}*${lk}`;
}
/*
function GetArtistAlbum(groupKey: string): [ArtistKey, AlbumKey] | void {
  if (groupKey.startsWith('R*')) {
    const index = groupKey.lastIndexOf('*');
    if (index > 2) {
      return [groupKey.substring(2, index), groupKey.substring(index + 1)];
    }
  }
}
*/
function IsTopGroup(groupKey: string): boolean {
  return groupKey.startsWith('*');
}

function AggregateSearchResults(
  songs: Map<SongKey, Song>,
  artists: Map<ArtistKey, Artist>,
  albums: Map<AlbumKey, Album>,
  searchResults: SearchResults,
): [SearchSongData[], IGroup[]] {
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
      MakeSongSearchEntry(songs.get(sk)!, idx, MakeAlbumGroupKey(album.key)),
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
        MakeArtistGroupKey(artist.key, song!.albumId),
      );
    });
  }
  const groups: IGroup[] = [];
  const results = searchResults.songs.map((songKey, index) =>
    MakeSongSearchEntry(songs.get(songKey)!, index, '*songs'),
  );
  if (results.length > 0) {
    groups.push({
      startIndex: 0,
      count: results.length,
      key: '*songs',
      name: 'Songs',
      isCollapsed: false,
      level: 0,
    });
  }
  const albumStart = results.length;
  const albumGroups: IGroup[] = [];
  let lastStart = albumStart;
  searchResults.albums.forEach((l) => {
    results.push(...MakeAlbumSongEntries(l));
    if (lastStart !== results.length) {
      albumGroups.push({
        startIndex: lastStart,
        count: results.length - lastStart,
        key: results[lastStart].group,
        name: results[lastStart].album,
        isCollapsed: true,
        level: 1,
      });
      lastStart = results.length;
    }
  });
  if (albumGroups.length > 0) {
    groups.push({
      startIndex: albumStart,
      count: results.length - albumStart,
      key: '*albums',
      name: 'Albums',
      isCollapsed: false,
      children: albumGroups,
      level: 0,
    });
  }
  const artistStart = results.length;
  const artistGroups: IGroup[] = [];
  lastStart = artistStart;
  searchResults.artists.forEach((r) => {
    results.push(...MakeArtistSongEntries(r));
    if (lastStart !== results.length) {
      artistGroups.push({
        startIndex: lastStart,
        count: results.length - lastStart,
        key: results[lastStart].group,
        name: results[lastStart].artist,
        isCollapsed: true,
        level: 1,
      });
      lastStart = results.length;
    }
  });
  if (artistGroups.length > 0) {
    groups.push({
      startIndex: artistStart,
      count: results.length - artistStart,
      key: '*artists',
      name: 'Artists',
      isCollapsed: false,
      children: artistGroups,
      level: 0,
    });
  }
  return [results, groups];
}

export default function SearchResultsView(): JSX.Element {
  const searchTerm = useRecoilValue(searchTermAtom);
  const searchResults = useRecoilValue(searchSel(searchTerm));
  const songs = useRecoilValue(allSongsSel);
  const artists = useRecoilValue(allArtistsSel);
  const albums = useRecoilValue(allAlbumsSel);
  const [curExpandedSet, setExpandedSet] = useState(new Set<string>());
  const onSongDetailClick = useRecoilCallback(
    ({ set }) => (item: SearchSongData) => set(songDetailAtom, item.song),
  );
  const onAddSongClick = useRecoilCallback(
    (cbInterface) => (item: SearchSongData) =>
      AddSongs([item.song.key], cbInterface),
  );
  const onAddSongListClick = useRecoilCallback(
    (cbInterface) => (songList: SongKey[]) => {
      AddSongs(songList, cbInterface);
    },
  );

  if (
    !searchResults.albums.length &&
    !searchResults.songs.length &&
    !searchResults.artists.length
  ) {
    return (
      <div className="empty-results">
        <Text>No results found</Text>
      </div>
    );
  }
  const [resultEntries, groups] = AggregateSearchResults(
    songs,
    artists,
    albums,
    searchResults,
  );
  const renderProps: IDetailsGroupRenderProps = {
    onToggleCollapseAll: (isAllCollapsed: boolean) => {
      setExpandedSet(
        new Set<string>(isAllCollapsed ? [] : groups.map((g) => g.key)),
      );
    },
    headerProps: {
      onToggleCollapse: (curGroup: IGroup) => {
        if (curExpandedSet.has(curGroup.key)) {
          curExpandedSet.delete(curGroup.key);
        } else {
          curExpandedSet.add(curGroup.key);
        }
        setExpandedSet(curExpandedSet);
      },
    },
    onRenderHeader: (props): JSX.Element | null => {
      if (!props || !props.group) return null;
      const groupProps = props.group;
      const groupKey = groupProps.key;
      const theStyle = IsTopGroup(groupKey) ? {} : { margin: '0 0 0 20px' };
      return (
        <Stack horizontal verticalAlign="center" style={theStyle}>
          <IconButton
            iconProps={{
              iconName: groupProps.isCollapsed ? 'ChevronRight' : 'ChevronDown',
            }}
            onClick={() => props.onToggleCollapse!(groupProps)}
          />
          <Text
            onDoubleClick={() =>
              onAddSongListClick(
                resultEntries
                  .slice(
                    groupProps.startIndex,
                    groupProps.startIndex + groupProps.count,
                  )
                  .map((entry) => entry.song.key),
              )
            }
          >
            {groupProps.name} [{groupProps.count} songs]
          </Text>
        </Stack>
      );
      // <AlbumHeaderDisplay album={albums.get(albumId)!} />
    },
  };
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
      ['r', 'artist', 'Artist', 150, 450],
      ['l', 'album', 'Album', 150, 450],
      ['n', 'track', '#', 30, 30],
      ['t', 'title', 'Title', 150, 450],
    ],
    () => '',
    (srt) => '',
  );

  return (
    <div data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          compact
          onRenderRow={altRowRenderer()}
          selectionMode={SelectionMode.none}
          items={resultEntries}
          columns={columns}
          groups={groups}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={onAddSongClick}
          groupProps={renderProps}
        />
      </ScrollablePane>
    </div>
  );
}
