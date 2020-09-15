// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import {
  Dialog,
  TextField,
  PrimaryButton,
  DefaultButton,
  Stack,
  Text,
  IconButton,
} from '@fluentui/react';
import { Comparisons } from '@freik/core-utils';

// import { SongBy } from '../../Sorters';
import SongLine from '../SongLine';
import { VerticalScrollDiv } from '../Scrollables';
import { shuffleAtom } from '../../Recoil/Atoms';
import {
  currentIndexAtom,
  nowPlayingAtom,
  playlistsAtom,
  songListAtom,
} from '../../Recoil/MusicDbAtoms';
import {
  startSongPlayingAtom,
  removeSongNumberAtom,
  stopAndClearAtom,
} from '../../Recoil/api';
import { PlayingPlaylist } from '../../Playlist';
import ConfirmationDialog from '../ConfirmationDialog';

import type { SongKey } from '../../DataSchema';

import './styles/NowPlaying.css';

export default function NowPlaying(): JSX.Element {
  const [nowPlaying, setNowPlaying] = useRecoilState(nowPlayingAtom);
  const [curPls, setCurPls] = useRecoilState(playlistsAtom);
  const [curIndex, setCurIndex] = useRecoilState(currentIndexAtom);
  const [songList, setSongList] = useRecoilState(songListAtom);

  const [showSaveAs, setShowSaveAs] = useState(false);
  const confirmationState = useState(false);
  const [,setShowConfirmation] = confirmationState;
  const [inputName, setInputName] = useState(nowPlaying);
  const [sortBy, setSortBy] = useState('');
  const [, setShuffle] = useRecoilState(shuffleAtom);

  const [, stopAndClear] = useRecoilState(stopAndClearAtom);
  const [, playSongNumber] = useRecoilState(startSongPlayingAtom);
  const [, removeSongNumber] = useRecoilState(removeSongNumberAtom);
  // Clear sorts when shuffle gets updated
  /*
  TODO
  useEffect(() => {
    // eslint-disable-next-line
    const sub: SubscriptionLike = store
      .on('shuffle')
      .subscribe((val) => val && setSortBy('')) as SubscriptionLike;
    return () => sub.unsubscribe();
  });
  */

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
  const topLine = (
    <h4 id="now-playing-header">
      {header}&nbsp;
      <DefaultButton
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
    const curKey: SongKey = songList[curIndex];
    switch (which) {
      case 'album':
        //        songList.sort(SongBy.AlbumAristNumberTitle(store));
        break;
      case 'artist':
        //      songList.sort(SongBy.ArtistAlbumNumberTitle(store));
        break;
      case 'track':
        //    songList.sort(SongBy.NumberAlbumArtistTitle(store));
        break;
      case 'title':
        //  songList.sort(SongBy.TitleAlbumAristNumber(store));
        break;
      default:
        return;
    }
    setSortBy(which);
    if (which) {
      setShuffle(false);
    }
    setCurIndex(songList.indexOf(curKey));
    setSongList([...songList]);
  };
  const songs = songList.map((songKey, idx) => {
    let clsName = idx % 2 ? 'songContainer oddSong' : 'songContainer evenSong';
    clsName += idx === curIndex ? ' playing' : ' not-playing';
    return (
      <SongLine
        key={songKey}
        songKey={songKey}
        onDoubleClick={() => playSongNumber(idx)}
        className={clsName}
        template="CLR#T"
      >
        <IconButton
          style={{ height: '28px', width: '28px' }}
          iconProps={{ iconName: 'Delete' }}
          onClick={() => removeSongNumber(idx)}
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
