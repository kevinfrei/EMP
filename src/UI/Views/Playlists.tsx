import {
  DetailsList,
  IColumn,
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
import { useState } from 'react';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import {
  DeletePlaylist,
  MyTransactionInterface,
  PlaySongs,
  RenamePlaylist,
  useMyTransaction,
} from '../../Recoil/api';
import { MakeSetState, useDialogState } from '../../Recoil/helpers';
import { PlaylistName } from '../../Recoil/Local';
import {
  allPlaylistsFunc,
  playlistFuncFam,
  playlistNamesFunc,
} from '../../Recoil/PlaylistsState';
import { allSongsFunc } from '../../Recoil/ReadOnly';
import { MakeSortKey } from '../../Sorting';
import { ConfirmationDialog, TextInputDialog } from '../Dialogs';
import {
  altRowRenderer,
  ProcessSongGroupData,
  StickyRenderDetailsHeader,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import { Spinner } from '../Utilities';
import './styles/Playlists.css';

type ItemType = PlaylistName;
type PlaylistSong = Song & { playlist: PlaylistName };
export function PlaylistSongCount({ id }: { id: PlaylistName }): JSX.Element {
  const playlist = useRecoilValue(playlistFuncFam(id));
  return <>{playlist.length}</>;
}

const [playlistExpandedState, playlistIsExpandedState] =
  MakeSetState<PlaylistName>('albumExpanded');

const playlistContextState = atom<SongListMenuData>({
  key: 'playlistContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

const playlistSortState = atom({
  key: 'playlistSort',
  default: MakeSortKey(['l', 'n'], ['lry', 'nrt']),
});

function PlaylistHeaderDisplay({ group }: { group: IGroup }): JSX.Element {
  const onHeaderExpanderClick = useMyTransaction(
    ({ set }) =>
      () =>
        set(playlistIsExpandedState(group.key), !group.isCollapsed),
  );
  const onAddSongsClick = useMyTransaction((xact) => () => {
    // TODO
    // AddSongs(xact, album.songs);
  });
  const onRightClick = useMyTransaction(
    ({ set }) =>
      (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        /*
        TODO
        set(albumContextState, {
          data: group.key,
          spot: { left: event.clientX + 14, top: event.clientY },
        }),
        */
      },
  );
  return (
    <Stack horizontal verticalAlign="center">
      <IconButton
        iconProps={{
          iconName: group.isCollapsed ? 'ChevronRight' : 'ChevronDown',
        }}
        onClick={onHeaderExpanderClick}
      />
      <Stack
        horizontal
        verticalAlign="center"
        onDoubleClick={onAddSongsClick}
        onContextMenu={onRightClick}
        style={{ padding: '2px 0px', cursor: 'pointer' }}
      >
        <Text>
          {group.name}: {group.count} Song{group.count !== 1 ? 's' : ''}
        </Text>
        <IconButton
          style={{ height: '20px', alignSelf: 'flex-end' }}
          iconProps={{ iconName: 'Delete' }}
          onClick={() => {
            /*
            TODO
            setSelected(item);
            showDelete();
            */
          }}
        />
      </Stack>
    </Stack>
  );
}

export default function PlaylistView(): JSX.Element {
  const [selected, setSelected] = useState('');
  const [showDelete, deleteData] = useDialogState();
  const [showRename, renameData] = useDialogState();

  const playlistNames = useRecoilValue(playlistNamesFunc);
  const playlistContents = useRecoilValue(allPlaylistsFunc);
  const allSongs = useRecoilValue(allSongsFunc);
  const [curSort, setSort] = useRecoilState(playlistSortState);

  const playlistExpanded = useRecoilState(playlistExpandedState);
  const [playlistContext, setPlaylistContext] =
    useRecoilState(playlistContextState);

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

  const deleteConfirmed = useMyTransaction((xact) => () => {
    DeletePlaylist(xact, selected);
  });

  const renameConfirmed = useMyTransaction((xact) => (newName: string) => {
    RenamePlaylist(xact, selected, newName);
  });

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
    [['p', 'playlist', 'Playlist', 50, 100]],
    (group: IGroup) => <PlaylistHeaderDisplay group={group} />,
    () => curSort,
    setSort,
  );
  const columns: IColumn[] = [
    {
      key: 'del',
      name: ' ',
      minWidth: 25,
      maxWidth: 25,
      onRender: (item: ItemType) => (
        <IconButton
          style={{ height: '20px' }}
          iconProps={{ iconName: 'Delete' }}
          onClick={() => {
            setSelected(item);
            showDelete();
          }}
        />
      ),
    },
    {
      key: 'title',
      name: 'Playlist Title',
      minWidth: 100,
      onRender: (item: ItemType) => item,
    },
    {
      key: 'count',
      name: '# of songs',
      minWidth: 75,
      onRender: (item: ItemType) => (
        <Spinner>
          <PlaylistSongCount id={item} />
        </Spinner>
      ),
    },
  ];
  return (
    <div data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
        <ConfirmationDialog
          data={deleteData}
          confirmFunc={deleteConfirmed}
          title="Are you sure?"
          text={`Do you really want to delete the playlist ${selected}?`}
          yesText="Delete"
          noText="Cancel"
        />
        <TextInputDialog
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
          onItemContextMenu={(item?: ItemType, index?: number, ev?: Event) => {
            if (ev && item) {
              const mev = ev as unknown as React.MouseEvent<
                HTMLElement,
                MouseEvent
              >;
              setPlaylistContext({
                data: item,
                spot: { left: mev.clientX + 14, top: mev.clientY },
              });
            }
            return false;
          }}
        />
        <SongListMenu
          context={playlistContext}
          onClearContext={() =>
            setPlaylistContext({ data: '', spot: { left: 0, top: 0 } })
          }
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
                showDelete();
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
      </ScrollablePane>
    </div>
  );
}
