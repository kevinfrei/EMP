import {
  DetailsList,
  IDetailsGroupRenderProps,
  IGroup,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { Artist, ArtistKey, Song, SongKey } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddSongList } from '../../Recoil/api';
import { currentIndexAtom, songListAtom } from '../../Recoil/Local';
import { allArtistsSel, allSongsSel } from '../../Recoil/ReadOnly';
import { AlbumFromSong, ArtistsFromSong, makeColumns } from '../SongList';
import './styles/Artists.css';

function CalcArtistGroups(
  allArtists: Map<ArtistKey, Artist>,
  allSongs: Map<SongKey, Song>,
  expanded: Set<ArtistKey>,
): [Song[], IGroup[]] {
  const groups: IGroup[] = [];
  const songs: Song[] = [];
  let runningTotal = 0;
  for (const [key, artist] of allArtists) {
    const group: IGroup = {
      count: artist.songs.length,
      key,
      name: artist.name,
      startIndex: runningTotal,
      isCollapsed: !expanded.has(key),
    };
    groups.push(group);
    runningTotal += group.count;
    songs.push(
      ...(artist.songs
        .map((v) => allSongs.get(v))
        .filter((value) => !!value) as Song[]),
    );
  }
  return [songs, groups];
}

export default function NewArtistList(): JSX.Element {
  const allSongsMap = useRecoilValue(allSongsSel);
  const allArtists = useRecoilValue(allArtistsSel);
  const curIndexState = useRecoilState(currentIndexAtom);
  const songListState = useRecoilState(songListAtom);
  const [curExpandedSet, setExpandedSet] = useState(new Set<ArtistKey>());

  const [songs, artistGroups] = CalcArtistGroups(
    allArtists,
    allSongsMap,
    curExpandedSet,
  );
  const columns = makeColumns(
    () => '',
    (str: string) => {
      return;
    },
    'artistIds',
    ['r', 'artistIds', 'Artist', 50, 175, ArtistsFromSong],
    ['l', 'albumId', 'Album', 50, 175, AlbumFromSong],
    ['n', 'track', '#', 10, 20],
    ['t', 'title', 'Title', 50, 150],
  );
  // We need to keep track of which headers are collapsed to re-render properly
  const groupProps: IDetailsGroupRenderProps = {
    onToggleCollapseAll: (isAllCollapsed: boolean) => {
      setExpandedSet(
        new Set<ArtistKey>(isAllCollapsed ? [] : allArtists.keys()),
      );
    },
    headerProps: {
      onToggleCollapse: (group: IGroup) => {
        if (curExpandedSet.has(group.key)) {
          curExpandedSet.delete(group.key);
        } else {
          curExpandedSet.add(group.key);
        }
        setExpandedSet(curExpandedSet);
      },
    },
  };
  return (
    <div className="current-view artistView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <DetailsList
          selectionMode={SelectionMode.none}
          items={songs}
          groups={artistGroups}
          columns={columns}
          onItemInvoked={(item: Song) =>
            AddSongList([item.key], curIndexState, songListState)
          }
          groupProps={groupProps}
        />
      </ScrollablePane>
    </div>
  );
}
