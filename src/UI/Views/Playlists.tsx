import {
  DetailsList,
  IColumn,
  IconButton,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { SongKey } from '@freik/core-utils';
import { useState } from 'react';
import {
  atom,
  CallbackInterface,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { deletePlaylist, PlaySongs, renamePlaylist } from '../../Recoil/api';
import { useDialogState } from '../../Recoil/helpers';
import { PlaylistName } from '../../Recoil/Local';
import {
  getPlaylistState,
  playlistNamesState,
} from '../../Recoil/PlaylistsState';
import { ConfirmationDialog, TextInputDialog } from '../Dialogs';
import { altRowRenderer, StickyRenderDetailsHeader } from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import { Spinner } from '../Utilities';
import './styles/Playlists.css';

type ItemType = PlaylistName;

export function PlaylistSongCount({ id }: { id: PlaylistName }): JSX.Element {
  const playlist = useRecoilValue(getPlaylistState(id));
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

  const [playlistContext, setPlaylistContext] = useRecoilState(
    playlistContextState,
  );

  const onPlaylistInvoked = useRecoilCallback(
    (cbInterface) => (playlistName: PlaylistName) => {
      const songs = cbInterface.snapshot
        .getLoadable(getPlaylistState(playlistName))
        .valueOrThrow();
      PlaySongs(cbInterface, songs, playlistName);
    },
  );

  const onRemoveDupes = useRecoilCallback(({ set, snapshot }) => async () => {
    if (!playlistNames.has(playlistContext.data)) {
      return;
    }
    const songs = await snapshot.getPromise(
      getPlaylistState(playlistContext.data),
    );
    const seen = new Set<SongKey>();
    const newList: SongKey[] = [];
    for (const song of songs) {
      if (!seen.has(song)) {
        newList.push(song);
      }
      seen.add(song);
    }
    set(getPlaylistState(playlistContext.data), newList);
  });

  const deleteConfirmed = useRecoilCallback((cbInterface) => async () => {
    await deletePlaylist(cbInterface, selected);
  });

  const renameConfirmed = useRecoilCallback(
    (cbInterface) => async (newName: string) => {
      await renamePlaylist(cbInterface, selected, newName);
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
              const mev = (ev as unknown) as React.MouseEvent<
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
          onGetSongList={(cbInterface: CallbackInterface, data: string) => {
            const list = cbInterface.snapshot
              .getLoadable(getPlaylistState(data))
              .valueMaybe();
            return list ? list : undefined;
          }}
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
