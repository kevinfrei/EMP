import {
  DetailsList,
  DetailsRow,
  getTheme,
  IColumn,
  IconButton,
  IDetailsRowProps,
  IDetailsRowStyles,
  IRenderFunction,
  SelectionMode,
} from '@fluentui/react';
import { SongKey } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilCallback } from 'recoil';
import { PlaySongs } from '../../Recoil/api';
import { useBackedState, useDialogState } from '../../Recoil/helpers';
import { nowPlayingAtom, playlistsAtom } from '../../Recoil/Local';
import { ConfirmationDialog } from '../Dialogs';
import { ViewProps } from './Selector';
import './styles/Playlists.css';

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

export default function Playlister({ hidden }: ViewProps): JSX.Element {
  const [playlists, setPlaylists] = useBackedState(playlistsAtom);
  const [selected, setSelected] = useState('');
  const [showConfirm, confirmData] = useDialogState();

  const onPlaylistInvoked = useRecoilCallback(
    ({ set }) => ([playlistName, keys]: [string, SongKey[]]) => {
      PlaySongs(keys, set);
      set(nowPlayingAtom, playlistName);
    },
  );
  const deletePlaylist = () => {
    if (playlists.delete(selected)) {
      setPlaylists(new Map(playlists));
    }
    setSelected('');
  };

  const columns: IColumn[] = [
    {
      key: 'del',
      name: ' ',
      minWidth: 25,
      maxWidth: 25,
      onRender: (item: [string, string[]]) => (
        <IconButton
          style={{ height: '20px' }}
          iconProps={{ iconName: 'Delete' }}
          onClick={() => {
            setSelected(item[0]);
            showConfirm();
          }}
        />
      ),
    },
    {
      key: 'title',
      name: 'Playlist Title',
      minWidth: 100,
      onRender: (item: [string, string[]]) => item[0],
    },
    {
      key: 'count',
      name: '# of songs',
      minWidth: 75,
      onRender: (item: [string, string[]]) => item[1].length,
    },
  ];

  return (
    <div
      className="current-view"
      style={hidden ? { visibility: 'hidden' } : {}}
    >
      <ConfirmationDialog
        data={confirmData}
        confirmFunc={deletePlaylist}
        title="Are you sure?"
        text={`Do you really want to delete the playlist ${selected}?`}
        yesText="Delete"
        noText="Cancel"
      />
      <DetailsList
        items={[...playlists.entries()]}
        selectionMode={SelectionMode.none}
        columns={columns}
        onRenderRow={renderRow}
        compact={true}
        onItemInvoked={onPlaylistInvoked}
      />
    </div>
  );
}
