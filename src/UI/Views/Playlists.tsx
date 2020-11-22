import {
  ContextualMenu,
  DetailsList,
  DetailsRow,
  getTheme,
  IColumn,
  IconButton,
  IDetailsRowProps,
  IDetailsRowStyles,
  IRenderFunction,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { MakeLogger, Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilCallback, useRecoilState } from 'recoil';
import { AddSongs, PlaySongs } from '../../Recoil/api';
import { useDialogState } from '../../Recoil/helpers';
import { nowPlayingAtom, PlaylistName } from '../../Recoil/Local';
import { playlistsSel } from '../../Recoil/ReadWrite';
import { ConfirmationDialog, TextInputDialog } from '../Dialogs';
import { StickyRenderDetailsHeader } from '../SongList';
import './styles/Playlists.css';

const log = MakeLogger('Playlists', true);

type ItemType = [PlaylistName, SongKey[]];

const theme = getTheme();

const renderRow: IRenderFunction<IDetailsRowProps> = (props) => {
  const customStyle: Partial<IDetailsRowStyles> = {};
  if (props) {
    if (props.itemIndex % 2 === 0) {
      customStyle.root = { backgroundColor: theme.palette.themeLighterAlt };
    }
    return <DetailsRow {...props} styles={customStyle} />;
  }
  return null;
};

export default function PlaylistView(): JSX.Element {
  const [playlists, setPlaylists] = useRecoilState(playlistsSel);
  const [selected, setSelected] = useState('');
  const [showDelete, deleteData] = useDialogState();
  const [showRename, renameData] = useDialogState();

  const [contextPlaylist, setContextPlaylist] = useState<string>('');
  const [contextTarget, setContextTarget] = useState<
    EventTarget | Event | null
  >(null);

  const onQueuePlaylist = useRecoilCallback(({ set }) => () => {
    const songs = playlists.get(contextPlaylist);
    if (songs) {
      log('songs:' + songs.length.toString());
      AddSongs(songs, set);
    } else {
      log('No songs :( ');
    }
  });

  const onPlaylistInvoked = useRecoilCallback(
    ({ set }) => ([playlistName, keys]: ItemType) => {
      set(nowPlayingAtom, playlistName);
      PlaySongs(keys, set);
    },
  );
  const deletePlaylist = () => {
    if (playlists.delete(selected)) {
      setPlaylists(new Map(playlists));
    }
    setSelected('');
  };
  const renamePlaylist = (newname: string) => {
    if (playlists.has(newname)) {
      // Don't allow renaming to overwrite the old value
      window.alert("Sorry: You can't rename to an existing playlist.");
    } else {
      const curVal = playlists.get(contextPlaylist);
      if (!curVal) return;
      playlists.delete(contextPlaylist);
      playlists.set(newname, curVal);
      setPlaylists(new Map(playlists));
    }
  };

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
            setSelected(item[0]);
            showDelete();
          }}
        />
      ),
    },
    {
      key: 'title',
      name: 'Playlist Title',
      minWidth: 100,
      onRender: (item: ItemType) => item[0],
    },
    {
      key: 'count',
      name: '# of songs',
      minWidth: 75,
      onRender: (item: ItemType) => item[1].length,
    },
  ];
  const items = [...playlists.entries()];
  return (
    <div data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
        <ConfirmationDialog
          data={deleteData}
          confirmFunc={deletePlaylist}
          title="Are you sure?"
          text={`Do you really want to delete the playlist ${selected}?`}
          yesText="Delete"
          noText="Cancel"
        />
        <TextInputDialog
          data={renameData}
          confirmFunc={renamePlaylist}
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
          onRenderRow={renderRow}
          compact={true}
          onItemInvoked={onPlaylistInvoked}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={(
            item?: [string, string[]],
            index?: number,
            ev?: Event,
          ) => {
            if (ev && Type.isArray(item)) {
              setContextPlaylist(item[0]);
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
              text: 'NYI: Add to Now Playing',
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
