import React, { useState, useEffect } from 'react';
import {
  Dialog,
  TextField,
  PrimaryButton,
  DefaultButton,
  Stack,
  Text,
} from '@fluentui/react';
import { Comparisons } from '@freik/core-utils';

import Store from '../../MyStore';

import {
  PlayingPlaylist,
  PlaySongNumber,
  StopAndClear,
  RemoveSongNumber,
} from '../../Playlist';
import { SongBy } from '../../Sorters';
import SongLine from '../SongLine';
import { VerticalScrollDiv } from '../Scrollables';

import './styles/NowPlaying.css';
import { SubscriptionLike } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const deletePic = require('../img/delete.svg') as string;

export default function NowPlaying(): JSX.Element {
  const store = Store.useStore();

  const nowPlaying: string = store.get('activePlaylistName');
  const setNowPlaying = store.set('activePlaylistName');
  const curPls = store.get('Playlists');
  const setCurPls = store.set('Playlists');
  const songList = store.get('songList');
  const curIndex = store.get('curIndex');

  const [showSaveAs, setShowSaveAs] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [inputName, setInputName] = useState(nowPlaying);
  const [sortBy, setSortBy] = useState('');
  // Clear sorts when shuffle gets updated
  useEffect(() => {
    // eslint-disable-next-line
    const sub: SubscriptionLike = store
      .on('shuffle')
      .subscribe((val) => val && setSortBy('')) as SubscriptionLike;
    return () => sub.unsubscribe();
  });

  const emptyQueue = songList.length === 0;
  // Helpers for the SaveAs dialog
  const justCloseSaveAs = () => setShowSaveAs(false);
  const showSaveDialog = () => setShowSaveAs(true);
  const saveAndClose = () => {
    if (curPls.get(inputName)) {
      window.alert('Cowardly refusing to overwrite existing playlist.');
    } else {
      curPls.set(inputName, [...songList]);
      setCurPls(curPls);
      setNowPlaying(inputName);
    }
    justCloseSaveAs();
  };
  // Helpers for the Confirm Delete dialog
  const closeConfirmation = () => setShowConfirmation(false);
  const approvedConfirmation = () => {
    StopAndClear(store);
    closeConfirmation();
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
          onChange={(ev, newValue) =>
            setInputName(newValue ? newValue : inputName)
          }
          label="Playlist name"
        />
        <Stack horizontal>
          <PrimaryButton onClick={justCloseSaveAs}>Cancel</PrimaryButton>
          <DefaultButton onClick={saveAndClose}>Save</DefaultButton>
        </Stack>
      </Stack>
    </Dialog>
  );
  const dlgConfirm = (
    <Dialog
      title="Please Confirm"
      hidden={!showConfirmation}
      onDismiss={closeConfirmation}
    >
      <Stack>
        <Text>Are you sure you want to clear the play queue?</Text>
        <Stack horizontal>
          <DefaultButton onClick={approvedConfirmation}>Yes</DefaultButton>
          <PrimaryButton onClick={closeConfirmation}>No</PrimaryButton>
        </Stack>
      </Stack>
    </Dialog>
  );

  let header;
  let button;
  const save = () => {
    curPls.set(nowPlaying, [...songList]);
    setCurPls(curPls);
  };
  if (PlayingPlaylist(nowPlaying)) {
    header = nowPlaying;
    // Only use this button if it's been modified?
    const curPlList = curPls.get(nowPlaying);
    const disabled =
      !curPlList || Comparisons.ArraySetEqual(songList, curPlList);
    button = (
      <DefaultButton onClick={save} className="save-playlist" disabled={disabled}>
        Save
      </DefaultButton>
    );
  } else {
    header = 'Now Playing';
    button = <></>;
  }
  const topLine = (
    <h4 id="now-playing-header">
      {header}&nbsp;
      <DefaultButton
        onClick={() => {
          if (PlayingPlaylist(nowPlaying)) {
            StopAndClear(store);
          } else {
            setShowConfirmation(true);
          }
        }}
        disabled={emptyQueue}
      >
        Clear Queue
      </DefaultButton>
      <DefaultButton
        className="save-playlist-as"
        onClick={showSaveDialog}
        disabled={emptyQueue}
      >
        Save As...
      </DefaultButton>
      {button}
    </h4>
  );

  const setSort = (which: string) => {
    if (which === sortBy) return;
    const curKey = songList[curIndex];
    switch (which) {
      case 'album':
        songList.sort(SongBy.AlbumAristNumberTitle(store));
        break;
      case 'artist':
        songList.sort(SongBy.ArtistAlbumNumberTitle(store));
        break;
      case 'track':
        songList.sort(SongBy.NumberAlbumArtistTitle(store));
        break;
      case 'title':
        songList.sort(SongBy.TitleAlbumAristNumber(store));
        break;
      default:
        return;
    }
    setSortBy(which);
    if (which) {
      store.set('shuffle')(false);
    }
    store.set('curIndex')(songList.indexOf(curKey));
    store.set('songList')([...songList]);
  };
  const songs = songList.map((songKey, idx) => {
    let clsName = idx % 2 ? 'songContainer oddSong' : 'songContainer evenSong';
    clsName += idx === curIndex ? ' playing' : ' not-playing';
    return (
      <SongLine
        key={songKey}
        songKey={songKey}
        onDoubleClick={() => PlaySongNumber(store, idx)}
        className={clsName}
        template="CLR#T"
      >
        <img
          className="delete-pic pic-button"
          src={deletePic}
          alt="Remove"
          onClick={() => RemoveSongNumber(store, idx)}
        />
      </SongLine>
    );
  });
  const isSortedBy = (theSort: string, thisOne: string): string =>
    theSort === thisOne ? 'sorted-header' : 'notsorted-header';

  return (
    <>
      {dlgSavePlaylist}
      {dlgConfirm}
      <div id="current-header">
        {topLine}
        <div className="songHeader">
          <div
            onClick={() => setSort('album')}
            className={isSortedBy(sortBy, 'album') + ' songAlbum'}
          >
            Album
          </div>
          <div
            onClick={() => setSort('artist')}
            className={isSortedBy(sortBy, 'artist') + ' songArtist'}
          >
            Artist
          </div>
          <div
            onClick={() => setSort('track')}
            className={isSortedBy(sortBy, 'track') + ' songTrack'}
          >
            #
          </div>
          <div
            onClick={() => setSort('title')}
            className={isSortedBy(sortBy, 'title') + ' songTitle'}
          >
            Title
          </div>
        </div>
      </div>
      <div id="current-view" />
      <VerticalScrollDiv scrollId="nowPlayingPos" layoutId="current-view">
        {songs}
      </VerticalScrollDiv>
    </>
  );
}
