import {
  DetailsList,
  IconButton,
  IGroup,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Text,
} from '@fluentui/react';
import { PlaylistName, Song, SongKey } from '@freik/media-core';
import {
  hasFieldType,
  isDefined,
  isNumber,
  isSymbol,
  isUndefined,
} from '@freik/typechk';
import { Dialogs, useDialogState } from '@freik/web-utils';
import {
  atom as jatom,
  useAtom,
  useAtomValue,
  useSetAtom,
  useStore,
} from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import { useState } from 'react';
import { allSongsAtom } from '../../Jotai/MusicDatabase';
import {
  allPlaylistsAtom,
  playlistAtomFam,
  playlistNamesAtom,
} from '../../Jotai/Playlists';
import { MakeSortKey } from '../../Sorting';
import {
  AlbumForSongRender,
  ArtistsForSongRender,
  YearForSongRender,
} from '../SimpleTags';
import {
  altRowRenderer,
  ProcessSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';

import { AsyncHandler, MakeSetAtomFamily, MyStore } from '../../Jotai/Helpers';
import {
  AddSongs,
  DeletePlaylist,
  PlaySongs,
  RenamePlaylist,
} from '../../Jotai/Interface';
import './styles/Playlists.css';

type PlaylistSong = Song & { playlist: PlaylistName };
type ItemType = PlaylistSong;

const [playlistExpandedState, playlistIsExpandedState] =
  MakeSetAtomFamily<PlaylistName>();

const playlistContextState = atomWithReset<SongListMenuData>({
  data: '',
  spot: { left: 0, top: 0 },
});

const songContextState = atomWithReset<SongListMenuData>({
  data: '',
  spot: { left: 0, top: 0 },
});

const playlistSortState = jatom(MakeSortKey(''));

function PlaylistHeaderDisplay({
  group,
  onDelete,
}: {
  group: IGroup;
  onDelete: (key: string) => void;
}): JSX.Element {
  const setPlaylistContext = useSetAtom(playlistContextState);
  const store = useStore();
  const onHeaderExpanderClick = () =>
    store.set(playlistIsExpandedState(group.key), !group.isCollapsed);
  const onAddSongsClick = AsyncHandler(async () => {
    const songs = await store.get(playlistAtomFam(group.key));
    await AddSongs(store, isSymbol(songs) ? [] : songs, group.key);
  });
  const onRightClick = (ev: React.MouseEvent<HTMLElement, MouseEvent>) => {
    setPlaylistContext({
      data: group.key,
      spot: { left: ev.clientX + 14, top: ev.clientY },
    });
    return false;
  };

  return (
    <div onAuxClick={onRightClick} className="playlist-header">
      <IconButton
        iconProps={{
          iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={onHeaderExpanderClick}
      />
      <div
        onDoubleClick={onAddSongsClick}
        style={{ padding: '2px 0px', cursor: 'pointer' }}
      >
        <Text>
          {group.name}: {group.count} Song{group.count !== 1 ? 's' : ''}
        </Text>
        <IconButton
          style={{ height: '20px', alignSelf: 'flex-end' }}
          iconProps={{ iconName: 'Delete' }}
          onClick={() => onDelete(group.key)}
        />
      </div>
    </div>
  );
}

export function PlaylistView(): JSX.Element {
  const [selected, setSelected] = useState('');
  const [songPlaylistToRemove, setSongPlaylistToRemove] = useState<
    [string, string, number]
  >(['', '', -1]);
  const [showPlaylistDelete, playlistDeleteData] = useDialogState();
  const [showRename, renameData] = useDialogState();
  const [showRemoveSong, removeSongData] = useDialogState();

  const playlistNames = useAtomValue(playlistNamesAtom);
  const playlistContents = useAtomValue(allPlaylistsAtom);
  const allSongs = useAtomValue(allSongsAtom);
  const playlistContext = useAtomValue(playlistContextState);
  const resetPlaylistContext = useResetAtom(playlistContextState);
  const playlistExpanded = useAtom(playlistExpandedState);
  const [curSort, setSort] = useAtom(playlistSortState);
  const [songContext, setSongContext] = useAtom(songContextState);
  const resetSongContext = useResetAtom(songContextState);
  const store = useStore();

  const clearSongContext = () => resetSongContext();
  const onClearPlaylist = () => resetPlaylistContext();
  const onPlaylistInvoked = AsyncHandler(async (playlistName: PlaylistName) => {
    const songs = await store.get(playlistAtomFam(playlistName));
    await PlaySongs(store, isSymbol(songs) ? [] : songs, playlistName);
  });
  const onRemoveDupes = AsyncHandler(async () => {
    if (!playlistNames.has(playlistContext.data)) {
      return;
    }
    const songs = await store.get(playlistAtomFam(playlistContext.data));
    const seen = new Set<SongKey>();
    const newList: SongKey[] = [];
    for (const song of isSymbol(songs) ? [] : songs) {
      if (!seen.has(song)) {
        newList.push(song);
      }
      seen.add(song);
    }
    await store.set(playlistAtomFam(playlistContext.data), newList);
  });
  const onPlaylistDelete = (key: string) => {
    setSelected(key);
    showPlaylistDelete();
  };
  const deleteConfirmed = () => {
    void DeletePlaylist(store, selected);
  };
  const renameConfirmed = (newName: string) => {
    void RenamePlaylist(store, selected, newName);
  };
  const removeSongConfirmed = AsyncHandler(async () => {
    if (
      songPlaylistToRemove[0].length > 0 &&
      songPlaylistToRemove[1].length > 0
    ) {
      const playlistName = songPlaylistToRemove[0];
      const songListMaybe = await store.get(playlistAtomFam(playlistName));
      const songList = isSymbol(songListMaybe) ? [] : songListMaybe;
      const songKey = songPlaylistToRemove[1];
      const index = songPlaylistToRemove[2];
      const listLocation = index >= 0 ? index : songList.indexOf(songKey);
      const plAtom = playlistAtomFam(songPlaylistToRemove[0]);
      const curList = await store.get(plAtom);
      if (!isSymbol(curList) && curList[listLocation] === songKey) {
        await store.set(
          plAtom,
          curList.filter((_v, i) => i !== listLocation),
        );
      }
    }
  });

  // TODO: make delete work
  const onTitleRenderer = (ttl: PlaylistSong, index?: number): JSX.Element => (
    <div style={{ marginLeft: -21 }}>
      <IconButton
        style={{ height: '20px' }}
        iconProps={{ iconName: 'Delete' }}
        onClick={(ev) => {
          setSongPlaylistToRemove([
            ttl.playlist,
            ttl.key,
            isUndefined(index) ? -1 : index,
          ]);
          if (ev.shiftKey) {
            removeSongConfirmed();
          } else {
            showRemoveSong();
          }
        }}
      />
      {ttl.title}
    </div>
  );

  const groups: IGroup[] = [];
  const expItems: PlaylistSong[] = [];

  let currCount = 0;
  for (const [plName, songs] of playlistContents) {
    groups.push({
      key: plName,
      name: plName,
      startIndex: currCount,
      count: songs.length,
      isCollapsed: !playlistExpanded[0].has(plName),
    });
    currCount += songs.length;
    expItems.push(
      ...(songs
        .map((key) => {
          const song = allSongs.get(key);
          return isUndefined(song) ? undefined : { playlist: plName, ...song };
        })
        .filter(isDefined) as PlaylistSong[]),
    );
  }

  const [expColumns, detailGroupRenderer] = ProcessSongGroupData(
    groups,
    playlistExpanded,
    'playlist',
    [
      ['t', 'title', 'Title', 100, 150, onTitleRenderer],
      ['r', 'artistIds', 'Artist', 100, 150, ArtistsForSongRender],
      ['l', 'albumId', 'Album', 100, 150, AlbumForSongRender],
      ['y', 'albumId', 'Year', 55, 25, YearForSongRender],
    ],
    (group: IGroup) => (
      <PlaylistHeaderDisplay group={group} onDelete={onPlaylistDelete} />
    ),
    () => curSort,
    setSort,
  );
  return (
    <div data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <Dialogs.ConfirmationDialog
          data={playlistDeleteData}
          confirmFunc={deleteConfirmed}
          title="Are you sure?"
          text={`Do you really want to delete the playlist ${selected}?`}
          yesText="Delete"
          noText="Cancel"
        />
        <Dialogs.ConfirmationDialog
          data={removeSongData}
          confirmFunc={removeSongConfirmed}
          title="Are you sure?"
          text="Do you really want to remove the song from the playlist?"
          yesText="Remove"
          noText="Cancel"
        />
        <Dialogs.TextInput
          data={renameData}
          onConfirm={renameConfirmed}
          title={`Rename ${selected}...`}
          text="What would you like the playlist to be renamed to?"
          initialValue={selected}
          yesText="Rename"
          noText="Cancel"
        />
        <DetailsList
          items={expItems}
          selectionMode={SelectionMode.none}
          columns={expColumns}
          groups={groups}
          onRenderRow={altRowRenderer()}
          compact={true}
          onItemInvoked={onPlaylistInvoked}
          groupProps={detailGroupRenderer}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={(item?: ItemType, _index?: number, ev?: Event) => {
            if (
              ev &&
              item &&
              hasFieldType(ev, 'clientX', isNumber) &&
              hasFieldType(ev, 'clientY', isNumber)
            ) {
              setSongContext({
                data: item.key,
                spot: { left: ev.clientX + 14, top: ev.clientY },
              });
            }
            return false;
          }}
        />
        <SongListMenu
          context={playlistContext}
          onClearContext={onClearPlaylist}
          onGetSongList={async (s: MyStore, data: string) => {
            const pl = await s.get(playlistAtomFam(data));
            return isSymbol(pl) ? [] : pl;
          }}
          onGetPlaylistName={(data: string) => data}
          items={[
            'add',
            'rep',
            {
              key: 'rename',
              text: `Rename "${playlistContext.data}"`,
              iconProps: { iconName: 'Rename' },
              onClick: () => {
                setSelected(playlistContext.data);
                showRename();
                return true;
              },
            },
            {
              key: 'delete',
              text: `Delete "${playlistContext.data}"`,
              iconProps: { iconName: 'Delete' },
              onClick: () => {
                setSelected(playlistContext.data);
                showPlaylistDelete();
              },
            },
            {
              key: 'unique',
              text: 'Remove Duplicates',
              iconProps: { iconName: 'MergeDuplicate' },
              onClick: onRemoveDupes,
            },
          ]}
        />
        <SongListMenu
          context={songContext}
          onClearContext={clearSongContext}
          onGetSongList={(_xact, data) => Promise.resolve([data])}
        />
      </ScrollablePane>
    </div>
  );
}
