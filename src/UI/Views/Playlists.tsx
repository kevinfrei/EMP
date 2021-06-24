import {
  DetailsList,
  IColumn,
  IconButton,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { SongKey } from '@freik/media-core';
import { useState } from 'react';
import {
  atom,
  TransactionInterface_UNSTABLE,
  useRecoilState,
  useRecoilTransaction_UNSTABLE,
  useRecoilValue,
} from 'recoil';
import { DeletePlaylist, PlaySongs, RenamePlaylist } from '../../Recoil/api';
import { useDialogState } from '../../Recoil/helpers';
import { PlaylistName } from '../../Recoil/Local';
import {
  getPlaylistFamily,
  playlistNamesState,
} from '../../Recoil/PlaylistsState';
import { ConfirmationDialog, TextInputDialog } from '../Dialogs';
import { altRowRenderer, StickyRenderDetailsHeader } from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import { Spinner } from '../Utilities';
import './styles/Playlists.css';

type ItemType = PlaylistName;

export function PlaylistSongCount({ id }: { id: PlaylistName }): JSX.Element {
  const playlist = useRecoilValue(getPlaylistFamily(id));
  return <>{playlist.length}</>;
}

const playlistContextState = atom<SongListMenuData>({
  key: 'playlistContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

export default function PlaylistView(): JSX.Element {
  const playlistNames = useRecoilValue(playlistNamesState);
  const [selected, setSelected] = useState('');
  const [showDelete, deleteData] = useDialogState();
  const [showRename, renameData] = useDialogState();

  const [playlistContext, setPlaylistContext] =
    useRecoilState(playlistContextState);

  const onPlaylistInvoked = useRecoilTransaction_UNSTABLE(
    (xact) => (playlistName: PlaylistName) => {
      const songs = xact.get(getPlaylistFamily(playlistName));
      PlaySongs(xact, songs, playlistName);
    },
  );

  const onRemoveDupes = useRecoilTransaction_UNSTABLE(({ get, set }) => () => {
    if (!playlistNames.has(playlistContext.data)) {
      return;
    }
    const songs = get(getPlaylistFamily(playlistContext.data));
    const seen = new Set<SongKey>();
    const newList: SongKey[] = [];
    for (const song of songs) {
      if (!seen.has(song)) {
        newList.push(song);
      }
      seen.add(song);
    }
    set(getPlaylistFamily(playlistContext.data), newList);
  });

  const deleteConfirmed = useRecoilTransaction_UNSTABLE((xact) => () => {
    DeletePlaylist(xact, selected);
  });

  const renameConfirmed = useRecoilTransaction_UNSTABLE(
    (xact) => (newName: string) => {
      RenamePlaylist(xact, selected, newName);
    },
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
  const items = [...playlistNames];
  return (
    <div data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
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
          items={items}
          selectionMode={SelectionMode.none}
          columns={columns}
          onRenderRow={altRowRenderer()}
          compact={true}
          onItemInvoked={onPlaylistInvoked}
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
          onGetSongList={(
            { get }: TransactionInterface_UNSTABLE,
            data: string,
          ) => get(getPlaylistFamily(data))}
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
