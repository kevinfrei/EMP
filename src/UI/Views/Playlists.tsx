import {
  ContextualMenu,
  DetailsList,
  IColumn,
  IconButton,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { useState } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import {
  AddSongs,
  deletePlaylist,
  PlaySongs,
  renamePlaylist,
} from '../../Recoil/api';
import { useDialogState } from '../../Recoil/helpers';
import { PlaylistName } from '../../Recoil/Local';
import { getPlaylistState, playlistNamesState } from '../../Recoil/ReadWrite';
import { ConfirmationDialog, TextInputDialog } from '../Dialogs';
import { altRowRenderer, StickyRenderDetailsHeader } from '../SongList';
import { Spinner } from '../Utilities';
import './styles/Playlists.css';

type ItemType = PlaylistName;

export function PlaylistSongCount({ id }: { id: PlaylistName }): JSX.Element {
  const playlist = useRecoilValue(getPlaylistState(id));
  return <>{playlist.length}</>;
}

export default function PlaylistView(): JSX.Element {
  const playlistNames = useRecoilValue(playlistNamesState);
  const [selected, setSelected] = useState('');
  const [showDelete, deleteData] = useDialogState();
  const [showRename, renameData] = useDialogState();

  const [contextPlaylist, setContextPlaylist] = useState<string>('');
  const [contextTarget, setContextTarget] = useState<
    EventTarget | Event | null
  >(null);

  const onQueuePlaylist = useRecoilCallback((cbInterface) => async () => {
    const songs = await cbInterface.snapshot.getPromise(
      getPlaylistState(contextPlaylist),
    );
    await AddSongs(songs, cbInterface);
  });

  const onPlaylistInvoked = useRecoilCallback(
    (cbInterface) => async (playlistName: PlaylistName) => {
      const songs = await cbInterface.snapshot.getPromise(
        getPlaylistState(playlistName),
      );
      await PlaySongs(cbInterface, songs, playlistName);
    },
  );

  const deleteConfirmed = useRecoilCallback((cbInterface) => async () => {
    await deletePlaylist(selected, cbInterface);
  });

  const renameConfirmed = useRecoilCallback(
    (cbInterface) => async (newName: string) => {
      await renamePlaylist(cbInterface, contextPlaylist, newName);
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
          title={`Rename ${contextPlaylist}...`}
          text="What would you like the playlist to be renamed to?"
          initialValue={contextPlaylist}
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
              setContextPlaylist(item);
              setContextTarget(ev);
            }
            return false;
          }}
        />
        <ContextualMenu
          hidden={contextTarget === null}
          onDismiss={() => setContextTarget(null)}
          items={[
            {
              key: 'queue',
              text: 'Add to Now Playing',
              onClick: onQueuePlaylist,
            },
            {
              key: 'rename',
              text: 'Rename',
              onClick: () => {
                showRename();
                return true;
              },
            },
            {
              key: 'delete',
              text: 'Delete',
              onClick: () => {
                setSelected(contextPlaylist);
                showDelete();
              },
            },
          ]}
          target={contextTarget as MouseEvent}
        />
      </ScrollablePane>
    </div>
  );
}
