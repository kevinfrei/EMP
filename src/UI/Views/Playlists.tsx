// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState } from 'react';
import {
  Dialog,
  DefaultButton,
  IconButton,
  DetailsList,
  DetailsRow,
  IDetailsRowProps,
  IDetailsRowStyles,
  IRenderFunction,
  IColumn,
  SelectionMode,
  PrimaryButton,
  Text,
  Stack,
  getTheme,
} from '@fluentui/react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { deletePlaylistAtom, startPlaylistAtom } from '../../Recoil/api';
import { playlistsAtom } from '../../Recoil/MusicDbAtoms';

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

export default function Playlister(): JSX.Element {
  const playlists = useRecoilValue(playlistsAtom);
  const [, deletePlaylist] = useRecoilState(deletePlaylistAtom);
  const [, startPlaylist] = useRecoilState(startPlaylistAtom);
  // Some local state
  const [selPlaylist, setSelPlaylist] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const columns: IColumn[] = [
    {
      key: 'del',
      name: ' ',
      minWidth: 25,
      maxWidth: 25,
      onRender: (item: [string, string[]]) => (
        <IconButton
          style={{ height: '17px' }}
          iconProps={{ iconName: 'Delete' }}
          onClick={() => {
            setSelPlaylist(item[0]);
            setShowDialog(false);
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
    <div className="current-view">
      <Dialog
        hidden={!showDialog}
        onDismiss={() => setShowDialog(false)}
        title="Are you sure?"
      >
        <Stack>
          <Text>
            Do you really want to delete the playlist "{selPlaylist}"?
          </Text>
          <Stack horizontal>
            <DefaultButton
              onClick={() => {
                setShowDialog(false);
                deletePlaylist(selPlaylist);
              }}
              text="Yes"
            />
            &nbsp;
            <PrimaryButton onClick={() => setShowDialog(false)} text="No" />
          </Stack>
        </Stack>
      </Dialog>
      <DetailsList
        items={[...(playlists.entries() as Iterable<string[]>)]}
        selectionMode={SelectionMode.none}
        columns={columns}
        onRenderRow={renderRow}
        onItemInvoked={(item: [string, string[]]) => startPlaylist(item[0])}
      />
    </div>
  );
}
