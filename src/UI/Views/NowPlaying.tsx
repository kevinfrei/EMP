import {
  DefaultButton,
  DetailsList,
  IconButton,
  IDetailsHeaderProps,
  ISeparatorStyles,
  IStackItemStyles,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Separator,
  Stack,
  Sticky,
  StickyPositionType,
  Text,
  TooltipHost,
} from '@fluentui/react';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import {
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';
import { StopAndClear } from '../../Recoil/api';
import { useDialogState } from '../../Recoil/helpers';
import {
  activePlaylistAtom,
  currentIndexAtom,
  nowPlayingSortAtom,
  shuffleAtom,
  songDetailAtom,
  songListAtom,
} from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  curSongsSel,
  saveableSel,
} from '../../Recoil/ReadOnly';
import {
  ignoreArticlesAtom,
  playlistNamesSel,
  playlistSel,
} from '../../Recoil/ReadWrite';
import { isPlaylist, SortSongs } from '../../Tools';
import { ConfirmationDialog, TextInputDialog } from '../Dialogs';
import {
  AlbumFromSong,
  altRowRenderer,
  ArtistsFromSong,
  MakeColumns,
} from '../SongList';
import './styles/NowPlaying.css';

// The top line of the Now Playing view: Buttons & dialogs & stuff
function TopLine(): JSX.Element {
  const playlists = useRecoilValue(playlistNamesSel);
  const nowPlaying = useRecoilValue(activePlaylistAtom);
  const songList = useRecoilValue(songListAtom);
  const saveEnabled = useRecoilValue(saveableSel);

  const [showSaveAs, saveAsData] = useDialogState();
  const [showConfirm, confirmData] = useDialogState();

  const saveListAs = useRecoilCallback(({ set }) => (inputName: string) => {
    if (playlists.has(inputName)) {
      window.alert("Sorry: You can't overwrite an existing playlist.");
    } else {
      set(playlistSel(inputName), [...songList]);
      set(activePlaylistAtom, inputName);
    }
  });
  const stopAndClear = useRecoilCallback((cbInterface) => async () => {
    await StopAndClear(cbInterface);
  });
  const clickClearQueue = useRecoilCallback((cbInterface) => async () => {
    if (isPlaylist(nowPlaying)) {
      await StopAndClear(cbInterface);
    } else {
      showConfirm();
    }
  });
  const save = useRecoilCallback(({ set }) => () => {
    set(playlistSel(nowPlaying), songList);
  });

  const emptyQueue = songList.length === 0;
  const isPL = isPlaylist(nowPlaying);
  const header = isPL ? nowPlaying : 'Now Playing';

  const sepStyle: Partial<ISeparatorStyles> = {
    root: { padding: 0, height: 2 },
  };
  return (
    <div id="current-header">
      <div className="now-playing-header">
        <TextInputDialog
          data={saveAsData}
          onConfirm={saveListAs}
          title="Save Playlist as..."
          text="What would you like the playlist to be named?"
          initialValue={nowPlaying}
          yesText="Save"
          noText="Cancel"
        />
        <ConfirmationDialog
          data={confirmData}
          confirmFunc={stopAndClear}
          title="Please Confirm"
          text="Are you sure you want to clear the play queue?"
        />
        <DefaultButton
          className="np-clear-queue"
          onClick={clickClearQueue}
          disabled={emptyQueue}
          style={{ width: 120 }}
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
          style={{ width: 120 }}
        >
          Save As...
        </DefaultButton>
        <DefaultButton
          onClick={save}
          className="save-playlist"
          disabled={!saveEnabled}
          style={{ width: 120 }}
        >
          Save
        </DefaultButton>
      </div>
      <Separator styles={sepStyle} />
    </div>
  );
}

function StickyDetailsHeader(
  theProps?: IDetailsHeaderProps,
  defaultRender?: (p?: IDetailsHeaderProps) => JSX.Element | null,
): JSX.Element | null {
  if (!theProps) {
    return null;
  }
  // This makes the header not have a bunch of extra whitespace above the header
  theProps.styles = { root: { padding: '0px' } };
  const stackStyles: IStackItemStyles = { root: { background: '#ffffff' } };
  return (
    <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
      <Stack styles={stackStyles}>
        <TopLine />
        {defaultRender!({
          ...theProps,
          onRenderColumnHeaderTooltip: (props) => <TooltipHost {...props} />,
        })}
      </Stack>
    </Sticky>
  );
}

// The Now Playing (Current playlist) view
export default function NowPlaying(): JSX.Element {
  const albums: Map<AlbumKey, Album> = useRecoilValue(allAlbumsSel);
  const artists: Map<ArtistKey, Artist> = useRecoilValue(allArtistsSel);
  const articles = useRecoilValue(ignoreArticlesAtom);
  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailAtom, item),
  );
  const [curIndex, setCurIndex] = useRecoilState(currentIndexAtom);
  const [songList, setSongList] = useRecoilState(songListAtom);
  const resetShuffle = useResetRecoilState(shuffleAtom);
  const [sortBy, setSortBy] = useRecoilState(nowPlayingSortAtom);
  const curSongs = useRecoilValue(curSongsSel);

  const drawDeleter = (song: Song) => (
    <IconButton
      style={{ height: '18px', width: '18px' }}
      iconProps={{ iconName: 'Delete' }}
      onClick={() => {
        // If we're going to be removing a song before the current index
        // we need to move the curIndex pointer as well
        const listLocation = songList.indexOf(song.key);
        if (listLocation < curIndex) {
          setCurIndex(curIndex - 1);
        }
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
      resetShuffle();
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

  return (
    <div data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
        <DetailsList
          compact={true}
          items={curSongs}
          selectionMode={SelectionMode.none}
          onRenderRow={altRowRenderer((props) => props.itemIndex === curIndex)}
          columns={columns}
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={(item, index) => setCurIndex(index ?? -1)}
          onRenderDetailsHeader={StickyDetailsHeader}
        />
      </ScrollablePane>
    </div>
  );
}
