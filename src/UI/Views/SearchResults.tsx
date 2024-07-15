import {
  DetailsList,
  IconButton,
  IDetailsGroupRenderProps,
  IGroup,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Text,
} from '@fluentui/react';
import { MakeLog } from '@freik/logger';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-core';
import { hasFieldType, isBoolean } from '@freik/typechk';
import { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { GetDataForSong, SongData } from '../../DataSchema';
import { SearchResults } from '../../ipc';
import { AddSongs } from '../../Jotai/API';
import {
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  searchFuncFam,
  searchTermState,
} from '../../Recoil/ReadOnly';
import { MakeSortKey } from '../../Sorting';
import {
  SongDetailClick,
  SongListDetailContextMenuClick,
} from '../DetailPanel/Clickers';
import {
  altRowRenderer,
  HeaderExpanderClick,
  MakeColumns,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/SearchResults.css';

const { wrn } = MakeLog('EMP:render:SearchResults');

type SearchSongData = SongData & { key: string; group: string };

function MakeAlbumGroupKey(albumKey: AlbumKey): string {
  return `L*${albumKey}`;
}
/*
function GetAlbumGroup(groupKey: string): string | void {
  if (groupKey.startsWith('L*')) {
    return groupKey.substring(2);
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
      return [groupKey.substring(2, 2 + index), groupKey.substring(index + 1)];
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
      if (song) {
        return MakeSongSearchEntry(
          song,
          idx,
          MakeArtistGroupKey(artist.key, song.albumId),
        );
      }
      throw Error('oops');
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

function SearchResultsGroupHeader(props: {
  depth: number;
  collapsed: boolean;
  expander: () => void;
  text: string;
  keys: SongKey[];
}): JSX.Element {
  const onAddSongListClick = useCallback(
    () => AddSongs(props.keys).catch(wrn),
    [props.keys],
  );
  const onRightClick = SongListDetailContextMenuClick(props.keys);
  const theStyle = { marginLeft: props.depth * 20 };
  return (
    <div style={theStyle}>
      <IconButton
        iconProps={{
          iconName: props.collapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={props.expander}
      />
      <Text onDoubleClick={onAddSongListClick} onContextMenu={onRightClick}>
        {props.text}
      </Text>
    </div>
  );
}

const noSort = MakeSortKey('rlnt');

export function SearchResultsView(): JSX.Element {
  const searchTerm = useRecoilValue(searchTermState);
  const searchResults = useRecoilValue(searchFuncFam(searchTerm));
  const songs = useRecoilValue(allSongsFunc);
  const artists = useRecoilValue(allArtistsFunc);
  const albums = useRecoilValue(allAlbumsFunc);
  const curExpandedState = useState(new Set<string>());
  const [curExpandedSet, setExpandedSet] = curExpandedState;
  const onSongDetailClick = (
    item: SearchSongData,
    _index?: number,
    ev?: Event,
  ) =>
    SongDetailClick(
      item.song,
      hasFieldType(ev, 'shiftKey', isBoolean) && ev.shiftKey,
    );
  const onAddSongClick = useCallback((item: SearchSongData) => {
    AddSongs([item.song.key]).catch(wrn);
  }, []);

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
        const newSet = new Set<string>(curExpandedSet);
        if (newSet.has(curGroup.key)) {
          newSet.delete(curGroup.key);
        } else {
          newSet.add(curGroup.key);
        }
        setExpandedSet(newSet);
      },
    },
    onRenderHeader: (props): JSX.Element | null => {
      if (!props || !props.group) return null;
      const groupProps = props.group;
      const groupKey = groupProps.key;
      const songKeys = resultEntries
        .slice(groupProps.startIndex, groupProps.startIndex + groupProps.count)
        .map((entry) => entry.song.key);
      return (
        <SearchResultsGroupHeader
          depth={IsTopGroup(groupKey) ? 0 : 1}
          collapsed={!!groupProps.isCollapsed}
          expander={() => HeaderExpanderClick(props, curExpandedState)}
          text={`${groupProps.name} [${groupProps.count} songs]`}
          keys={songKeys}
        />
      );
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
    () => noSort,
    () => 0,
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
