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
import { hasFieldType, isDefined, isNumber, isUndefined } from '@freik/typechk';
import {
  Dialogs,
  MyTransactionInterface,
  useDialogState,
} from '@freik/web-utils';
import { atom as jatom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useJotaiAsyncCallback, useJotaiCallback } from '../../Jotai/Helpers';
import { MakeSetAtomFamily } from '../../Jotai/Hooks';
import { allSongsFunc } from '../../Recoil/ReadOnly';
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

import { MakeLog } from '@freik/logger';
import { AddSongs, PlaySongs } from '../../Jotai/API';
import {
  allPlaylistsState,
  DeletePlaylist,
  playlistNamesState,
  playlistStateFamily,
  RenamePlaylist,
} from '../../Jotai/PlaylistControl';
import './styles/Playlists.css';

const { wrn } = MakeLog('EMP:render:Playlists');
wrn.enabled = true;

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
  const expandedAtom = playlistIsExpandedState(group.key);
  const setPlaylistContext = useSetAtom(playlistContextState);
  const onHeaderExpanderClick = useJotaiCallback(
    (get, set) => set(expandedAtom, !group.isCollapsed),
    [expandedAtom, group.isCollapsed],
  );
  const thisPlaylist = useAtomValue(playlistStateFamily(group.key));
  const onAddSongsClick = useCallback(() => {
    AddSongs(thisPlaylist, group.key).catch(wrn);
  }, [group.key, thisPlaylist]);
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

  const playlistNames = new Set(useAtomValue(playlistNamesState));
  const playlistContents = useAtomValue(allPlaylistsState);
  const allSongs = useRecoilValue(allSongsFunc);
  const playlistContext = useAtomValue(playlistContextState);
  const resetPlaylistContext = useResetAtom(playlistContextState);
  const playlistExpanded = useAtom(playlistExpandedState);
  const [curSort, setSort] = useAtom(playlistSortState);
  const [songContext, setSongContext] = useAtom(songContextState);
  const resetSongContext = useResetAtom(songContextState);

  const clearSongContext = () => resetSongContext();
  const onClearPlaylist = () => resetPlaylistContext();
  const onPlaylistInvoked = useJotaiAsyncCallback(
    async (get, set, playlistName: PlaylistName) => {
      const songs = await get(playlistStateFamily(playlistName));
      PlaySongs(songs, playlistName).catch(wrn);
    },
    [],
  );
  const onRemoveDupes = useJotaiAsyncCallback(
    async (get, set) => {
      if (!playlistNames.has(playlistContext.data)) {
        return;
      }
      const songs = await get(playlistStateFamily(playlistContext.data));
      const seen = new Set<SongKey>();
      const newList: SongKey[] = [];
      for (const song of songs) {
        if (!seen.has(song)) {
          newList.push(song);
        }
        seen.add(song);
      }
      set(playlistStateFamily(playlistContext.data), newList);
    },
    [playlistNames, playlistContext.data],
  );
  const onPlaylistDelete = useCallback((key: string) => {
    setSelected(key);
    showPlaylistDelete();
  }, []);
  const deleteConfirmed = useCallback(
    () => DeletePlaylist(selected),
    [selected],
  );
  const renameConfirmed = useCallback(
    (newName: string) => RenamePlaylist(selected, newName),
    [selected],
  );
  const removeSongConfirmed = useJotaiAsyncCallback(
    async (get, set) => {
      if (
        songPlaylistToRemove[0].length > 0 &&
        songPlaylistToRemove[1].length > 0
      ) {
        const playlistName = songPlaylistToRemove[0];
        const songList = await get(playlistStateFamily(playlistName));
        const songKey = songPlaylistToRemove[1];
        const index = songPlaylistToRemove[2];
        const listLocation = index >= 0 ? index : songList.indexOf(songKey);
        const prvSongList = await get(
          playlistStateFamily(songPlaylistToRemove[0]),
        );
        const newSongList = prvSongList.filter((v, i) => i !== listLocation);
        await set(playlistStateFamily(songPlaylistToRemove[0]), newSongList);
      }
    },
    [songPlaylistToRemove],
  );

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

  const onGetSongList = useJotaiAsyncCallback(
    async (get, set, xact: MyTransactionInterface, data: string) =>
      await get(playlistStateFamily(data)),
    [],
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
          onGetSongList={onGetSongList}
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
          onGetSongList={(_xact, data) => [data]}
        />
      </ScrollablePane>
    </div>
  );
}
