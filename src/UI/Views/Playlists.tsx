import {
  DetailsList,
  IconButton,
  IGroup,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Stack,
  Text,
} from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { Song, SongKey } from '@freik/media-core';
import {
  Dialogs,
  MakeSetState,
  MyTransactionInterface,
  useDialogState,
  useMyTransaction,
} from '@freik/web-utils';
import { useState } from 'react';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import {
  AddSongs,
  DeletePlaylist,
  PlaySongs,
  RenamePlaylist,
} from '../../Recoil/api';
import { PlaylistName } from '../../Recoil/Local';
import {
  allPlaylistsFunc,
  playlistFuncFam,
  playlistNamesFunc,
} from '../../Recoil/PlaylistsState';
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
import './styles/Playlists.css';

type PlaylistSong = Song & { playlist: PlaylistName };
type ItemType = PlaylistSong;

const [playlistExpandedState, playlistIsExpandedState] =
  MakeSetState<PlaylistName>('playlistExpanded');

const playlistContextState = atom<SongListMenuData>({
  key: 'playlistContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

const songContextState = atom<SongListMenuData>({
  key: 'playlistSongContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

const playlistSortState = atom({
  key: 'playlistSort',
  default: MakeSortKey(''),
});

function PlaylistHeaderDisplay({
  group,
  onDelete,
}: {
  group: IGroup;
  onDelete: (key: string) => void;
}): JSX.Element {
  const onHeaderExpanderClick = useMyTransaction(
    ({ set }) =>
      () =>
        set(playlistIsExpandedState(group.key), !group.isCollapsed),
  );
  const onAddSongsClick = useMyTransaction((xact) => () => {
    AddSongs(xact, xact.get(playlistFuncFam(group.key)));
  });
  const onRightClick = useMyTransaction(
    ({ set }) =>
      (ev: React.MouseEvent<HTMLElement, MouseEvent>) => {
        set(playlistContextState, {
          data: group.key,
          spot: { left: ev.clientX + 14, top: ev.clientY },
        });
        return false;
      },
  );
  return (
    <div onAuxClick={onRightClick}>
      <Stack horizontal verticalAlign="center">
        <IconButton
          iconProps={{
            iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
          }}
          onClick={onHeaderExpanderClick}
        />
        <Stack
          onDoubleClick={onAddSongsClick}
          horizontal
          verticalAlign="center"
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
        </Stack>
      </Stack>
    </div>
  );
}

export default function PlaylistView(): JSX.Element {
  const [selected, setSelected] = useState('');
  const [songPlaylistToRemove, setSongPlaylistToRemove] = useState<
    [string, string, number]
  >(['', '', -1]);
  const [showPlaylistDelete, playlistDeleteData] = useDialogState();
  const [showRename, renameData] = useDialogState();
  const [showRemoveSong, removeSongData] = useDialogState();

  const playlistNames = useRecoilValue(playlistNamesFunc);
  const playlistContents = useRecoilValue(allPlaylistsFunc);
  const allSongs = useRecoilValue(allSongsFunc);
  const playlistContext = useRecoilValue(playlistContextState);

  const playlistExpanded = useRecoilState(playlistExpandedState);
  const [curSort, setSort] = useRecoilState(playlistSortState);
  const [songContext, setSongContext] = useRecoilState(songContextState);
  const clearSongContext = useMyTransaction(
    ({ reset }) =>
      () =>
        reset(songContextState),
  );
  const onClearPlaylist = useMyTransaction(
    ({ reset }) =>
      () =>
        reset(playlistContextState),
  );
  const onPlaylistInvoked = useMyTransaction(
    (xact) => (playlistName: PlaylistName) => {
      const songs = xact.get(playlistFuncFam(playlistName));
      PlaySongs(xact, songs, playlistName);
    },
  );
  const onRemoveDupes = useMyTransaction(({ get, set }) => () => {
    if (!playlistNames.has(playlistContext.data)) {
      return;
    }
    const songs = get(playlistFuncFam(playlistContext.data));
    const seen = new Set<SongKey>();
    const newList: SongKey[] = [];
    for (const song of songs) {
      if (!seen.has(song)) {
        newList.push(song);
      }
      seen.add(song);
    }
    set(playlistFuncFam(playlistContext.data), newList);
  });
  const onPlaylistDelete = (key: string) => {
    setSelected(key);
    showPlaylistDelete();
  };
  const deleteConfirmed = useMyTransaction((xact) => () => {
    DeletePlaylist(xact, selected);
  });
  const renameConfirmed = useMyTransaction((xact) => (newName: string) => {
    RenamePlaylist(xact, selected, newName);
  });
  const removeSongConfirmed = useMyTransaction((xact) => () => {
    if (
      songPlaylistToRemove[0].length > 0 &&
      songPlaylistToRemove[1].length > 0
    ) {
      const playlistName = songPlaylistToRemove[0];
      const songList = xact.get(playlistFuncFam(playlistName));
      const songKey = songPlaylistToRemove[1];
      const index = songPlaylistToRemove[2];
      const listLocation = index >= 0 ? index : songList.indexOf(songKey);
      xact.set(
        playlistFuncFam(songPlaylistToRemove[0]),
        (curList: SongKey[]) => {
          if (curList[listLocation] === songKey) {
            return curList.filter((_v, i) => i !== listLocation);
          } else {
            return curList;
          }
        },
      );
    }
  });

  // TODO: make delete work
  const onTitleRenderer = (ttl: PlaylistSong, index?: number): JSX.Element => (
    <Stack horizontal style={{ marginLeft: -21 }}>
      <IconButton
        style={{ height: '20px' }}
        iconProps={{ iconName: 'Delete' }}
        onClick={(ev) => {
          setSongPlaylistToRemove([
            ttl.playlist,
            ttl.key,
            Type.isUndefined(index) ? -1 : index,
          ]);
          if (ev.shiftKey) {
            removeSongConfirmed();
          } else {
            showRemoveSong();
          }
        }}
      />
      {ttl.title}
    </Stack>
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
          return Type.isUndefined(song)
            ? undefined
            : { playlist: plName, ...song };
        })
        .filter((val) => !Type.isUndefined(val)) as PlaylistSong[]),
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
      ['y', 'albumId', 'Year', 45, 45, YearForSongRender],
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
        <Dialogs.Confirmation
          data={playlistDeleteData}
          confirmFunc={deleteConfirmed}
          title="Are you sure?"
          text={`Do you really want to delete the playlist ${selected}?`}
          yesText="Delete"
          noText="Cancel"
        />
        <Dialogs.Confirmation
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
              Type.hasType(ev, 'clientX', Type.isNumber) &&
              Type.hasType(ev, 'clientY', Type.isNumber)
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
          onGetSongList={({ get }: MyTransactionInterface, data: string) =>
            get(playlistFuncFam(data))
          }
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
