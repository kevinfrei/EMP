import {
  DefaultButton,
  DetailsList,
  DetailsRow,
  getTheme,
  IconButton,
  IDetailsListProps,
  IDetailsRowStyles,
  SelectionMode,
  Text,
} from '@fluentui/react';
import { Comparisons } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue, useResetRecoilState } from 'recoil';
import { StopAndClear } from '../../Recoil/api';
import { useBoolState } from '../../Recoil/helpers';
import {
  activePlaylistAtom,
  currentIndexAtom,
  nowPlayingAtom,
  nowPlayingSortAtom,
  playlistsAtom,
  shuffleAtom,
  songListAtom,
} from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  curSongsSel,
} from '../../Recoil/ReadOnly';
import { sortWithArticlesAtom } from '../../Recoil/ReadWrite';
import { isPlaylist, SortSongs } from '../../Tools';
import { ConfirmationDialog, TextInputDialog } from '../Dialogs';
import { AlbumFromSong, ArtistsFromSong, MakeColumns } from '../SongList';
import { ViewProps } from './Selector';
import './styles/NowPlaying.css';

// const log = Logger.bind('NowPlaying');
// Logger.enable('NowPlaying');

const theme = getTheme();

// The top line of the Now Playing view: Buttons & dialogs & stuff
function TopLine(): JSX.Element {
  const [playlists, setPlaylists] = useRecoilState(playlistsAtom);
  const [nowPlaying, setNowPlaying] = useRecoilState(nowPlayingAtom);

  const songList = useRecoilValue(songListAtom);

  const [saveAsState, showSaveAs, hideSaveAs] = useBoolState(true);
  const [confirmState, showConfirm, hideConfirm] = useBoolState(true);

  const resetSongList = useResetRecoilState(songListAtom);
  const resetCurIndex = useResetRecoilState(currentIndexAtom);
  const resetActivePlaylist = useResetRecoilState(activePlaylistAtom);
  const resetNowPlaying = useResetRecoilState(nowPlayingAtom);

  const saveListAs = (inputName: string) => {
    if (playlists.get(inputName)) {
      window.alert('Cowardly refusing to overwrite existing playlist.');
    } else {
      playlists.set(inputName, [...songList]);
      setPlaylists(playlists);
      setNowPlaying(inputName);
    }
  };

  const emptyQueue = songList.length === 0;

  const stopAndClear = () => {
    StopAndClear(
      resetSongList,
      resetCurIndex,
      resetActivePlaylist,
      resetNowPlaying,
    );
  };
  const clickClearQueue = () => {
    if (isPlaylist(nowPlaying)) {
      stopAndClear();
    } else {
      showConfirm();
    }
  };
  let header;
  let button;
  const save = () => {
    playlists.set(nowPlaying, [...songList]);
    setPlaylists(playlists);
  };
  if (isPlaylist(nowPlaying)) {
    header = nowPlaying;
    // Only enable this button if the playlist has been *modified*
    // (not just sorted)
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

  return (
    <div id="current-header">
      <TextInputDialog
        hidden={saveAsState}
        hide={hideSaveAs}
        confirmFunc={saveListAs}
        title="Save Playlist as..."
        text="What would you like the playlist to be named?"
        initialValue={nowPlaying}
        yesText="Save"
        noText="Cancel"
      />
      <ConfirmationDialog
        hidden={confirmState}
        hide={hideConfirm}
        confirmFunc={stopAndClear}
        title="Please Confirm"
        text="Are you sure you want to clear the play queue?"
      />
      <div id="now-playing-header">
        <DefaultButton
          className="np-clear-queue"
          onClick={clickClearQueue}
          disabled={emptyQueue}
        >
          Clear Queue
        </DefaultButton>
        <Text
          className="np-current-playlist"
          variant="large"
          block={true}
          nowrap={true}
        >
          {header}
        </Text>
        <DefaultButton
          className="save-playlist-as"
          onClick={showSaveAs}
          disabled={emptyQueue}
        >
          Save As...
        </DefaultButton>
        {button}
      </div>
    </div>
  );
}

// The Now Playing (Current playlist) view
export default function NowPlaying({ hidden }: ViewProps): JSX.Element {
  const albums: Map<AlbumKey, Album> = useRecoilValue(allAlbumsSel);
  const artists: Map<ArtistKey, Artist> = useRecoilValue(allArtistsSel);
  const articles = useRecoilValue(sortWithArticlesAtom);

  const [curIndex, setCurIndex] = useRecoilState(currentIndexAtom);
  const [songList, setSongList] = useRecoilState(songListAtom);
  const [shuffle, setShuffle] = useRecoilState(shuffleAtom);
  const [sortBy, setSortBy] = useRecoilState(nowPlayingSortAtom);
  const curSongs = useRecoilValue(curSongsSel);

  const drawDeleter = (song: Song) => (
    <IconButton
      style={{ height: '18px', width: '18px' }}
      iconProps={{ iconName: 'Delete' }}
      onClick={() => {
        setSongList(songList.filter((v) => v !== song.key));
      }}
    />
  );

  const performSort = (srt: string) => {
    setSortBy(srt);
    if (srt !== '') {
      const sortedSongs = SortSongs(srt, curSongs, albums, artists, articles);
      const curKey: SongKey = songList[curIndex];
      let newKey = -1;
      const newSongList = sortedSongs.map((song: Song, index: number) => {
        if (song.key === curKey) {
          newKey = index;
        }
        return song.key;
      });
      setSongList(newSongList);
      setCurIndex(newKey);
      if (shuffle) {
        setShuffle(false);
      }
    }
  };

  const columns = MakeColumns(
    [
      ['X', '', '', 25, 25, drawDeleter],
      ['l', 'albumId', 'Album', 50, 175, AlbumFromSong],
      ['r', 'artistIds', 'Artist(s)', 50, 150, ArtistsFromSong],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
    ],
    () => sortBy,
    performSort,
  );

  // This does the light/dark swapping, with the current song in bold
  const renderAltRow: IDetailsListProps['onRenderRow'] = (props) => {
    const customStyles: Partial<IDetailsRowStyles> = {};
    if (props) {
      let backgroundColor = '';
      let fontWeight = 'normal';
      if (props.itemIndex === curIndex) {
        fontWeight = 'bold';
      }
      if (props.itemIndex % 2 === 0) {
        backgroundColor = theme.palette.themeLighterAlt;
      }
      customStyles.root = { backgroundColor, fontWeight };
      return <DetailsRow {...props} styles={customStyles} />;
    }
    return null;
  };

  return (
    <div
      className="current-view"
      style={hidden ? { visibility: 'hidden' } : {}}
    >
      <TopLine />
      <div className="current-view">
        <DetailsList
          compact={true}
          items={curSongs}
          selectionMode={SelectionMode.none}
          onRenderRow={renderAltRow}
          columns={columns}
          onItemInvoked={(item, index) => setCurIndex(index ?? -1)}
        />
      </div>
    </div>
  );
}
