// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  Dialog,
  Text,
  TextField,
  PrimaryButton,
  DefaultButton,
  Stack,
  IconButton,
  DetailsList,
  SelectionMode,
} from '@fluentui/react';
import { Comparisons } from '@freik/core-utils';

// import { SongBy } from '../../Sorters';
// import { shuffleAtom } from '../../Recoil/Atoms';
import {
  allSongsSel,
  //  currentIndexAtom,
} from '../../Recoil/ReadOnly';
import {
  nowPlayingAtom,
  playlistsAtom,
  songListAtom,
} from '../../Recoil/Local';
import { startSongPlayingAtom, stopAndClearAtom } from '../../Recoil/api';
import { PlayingPlaylist } from '../../Playlist';
import ConfirmationDialog from '../ConfirmationDialog';

import type { Song } from '../../DataSchema';

import './styles/NowPlaying.css';
import {
  AlbumFromSong,
  ArtistsFromSong,
  makeColumns,
  renderAltRow,
} from '../SongList';

export default function NowPlaying(): JSX.Element {
  const [nowPlaying, setNowPlaying] = useRecoilState(nowPlayingAtom);
  const [playlists, setPlaylists] = useRecoilState(playlistsAtom);
  //  const [curIndex, setCurIndex] = useRecoilState(currentIndexAtom);
  const [songList, setSongList] = useRecoilState(songListAtom);
  const allSongs = useRecoilValue(allSongsSel);

  const [showSaveAs, setShowSaveAs] = useState(false);
  const confirmationState = useState(false);
  const [, setShowConfirmation] = confirmationState;
  const [inputName, setInputName] = useState(nowPlaying);
  const [sortBy, setSortBy] = useState('');
  //  const [, setShuffle] = useRecoilState(shuffleAtom);

  const [, stopAndClear] = useRecoilState(stopAndClearAtom);
  const [, playSongNumber] = useRecoilState(startSongPlayingAtom);

  const emptyQueue = songList.length === 0;
  // Helpers for the SaveAs dialog
  const justCloseSaveAs = () => setShowSaveAs(false);
  const showSaveDialog = () => setShowSaveAs(true);
  const saveAndClose = () => {
    if (playlists.get(inputName)) {
      window.alert('Cowardly refusing to overwrite existing playlist.');
    } else {
      playlists.set(inputName, [...songList]);
      setPlaylists(playlists);
      setNowPlaying(inputName);
    }
    justCloseSaveAs();
  };
  const dlgSavePlaylist = (
    <Dialog
      title="Save Playlist as..."
      hidden={!showSaveAs}
      onDismiss={justCloseSaveAs}
    >
      <Stack>
        <TextField
          value={inputName}
          onChange={(ev, newValue) => setInputName(newValue ?? inputName)}
        />
        <br />
        <div>
          <PrimaryButton style={{ float: 'left' }} onClick={justCloseSaveAs}>
            Cancel
          </PrimaryButton>
          <DefaultButton style={{ float: 'right' }} onClick={saveAndClose}>
            Save
          </DefaultButton>
        </div>
      </Stack>
    </Dialog>
  );

  const dlgConfirm = ConfirmationDialog(
    confirmationState,
    'Please Confirm',
    'Are you sure you want to clear the play queue?',
    'Yes',
    'No',
    () => stopAndClear(true),
  );

  let header;
  let button;
  const save = () => {
    playlists.set(nowPlaying, [...songList]);
    setPlaylists(playlists);
  };
  if (PlayingPlaylist(nowPlaying)) {
    header = nowPlaying;
    // Only use this button if it's been modified?
    const curPlList = playlists.get(nowPlaying);
    const disabled =
      !curPlList || Comparisons.ArraySetEqual(songList, curPlList);
    button = (
      <DefaultButton
        onClick={save}
        className="save-playlist"
        disabled={disabled}
      >
        Save
      </DefaultButton>
    );
  } else {
    header = 'Now Playing';
    button = <></>;
  }
  const clearQueue = (
    <DefaultButton
      className="np-clear-queue"
      onClick={() => {
        if (PlayingPlaylist(nowPlaying)) {
          stopAndClear(true);
        } else {
          setShowConfirmation(true);
        }
      }}
      disabled={emptyQueue}
    >
      Clear Queue
    </DefaultButton>
  );
  const nameOrHeader = (
    <Text
      className="np-current-playlist"
      variant="large"
      block={true}
      nowrap={true}
    >
      {header}
    </Text>
  );
  const saveAs = (
    <DefaultButton
      className="save-playlist-as"
      onClick={showSaveDialog}
      disabled={emptyQueue}
    >
      Save As...
    </DefaultButton>
  );
  const topLine = (
    <div id="now-playing-header">
      {clearQueue}
      {nameOrHeader}
      {saveAs}
      {button}
    </div>
  );

  const drawDeleter = (song: Song) => (
    <IconButton
      style={{ height: '18px', width: '18px' }}
      iconProps={{ iconName: 'Delete' }}
      onClick={() => setSongList(songList.filter((v) => v !== song.key))}
    />
  );

  const columns = makeColumns<Song>(
    () => sortBy,
    (srt: string) => {
      setSortBy(srt);
      /* TODO: Get the sort effected */
    },
    ['X', '', '', 25, 25, drawDeleter],
    ['l', 'albumId', 'Album', 50, 450, AlbumFromSong],
    ['r', 'artistIds', 'Artist(s)', 50, 450, ArtistsFromSong],
    ['n', 'track', '#', 10, 40],
    ['t', 'title', 'Title', 50],
  );

  return (
    <>
      {dlgSavePlaylist}
      {dlgConfirm}
      <div id="current-header">{topLine}</div>
      <div className="current-view">
        <DetailsList
          compact={true}
          items={songList.map((sl) => allSongs.get(sl))}
          selectionMode={SelectionMode.none}
          onRenderRow={renderAltRow}
          columns={columns}
          onItemInvoked={(item, index) => playSongNumber(index ?? -1)}
        />
      </div>
    </>
  );
}
