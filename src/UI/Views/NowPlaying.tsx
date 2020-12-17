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
} from '@freik/core-utils';
import {
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';
import { StopAndClear } from '../../Recoil/api';
import { useDialogState } from '../../Recoil/helpers';
import {
  activePlaylistState,
  currentIndexState,
  nowPlayingSortState,
  songDetailState,
  songListState,
} from '../../Recoil/Local';
import {
  getPlaylistState,
  playlistNamesState,
  saveableState,
} from '../../Recoil/PlaylistsState';
import {
  allAlbumsState,
  allArtistsState,
  curSongsState,
} from '../../Recoil/ReadOnly';
import { ignoreArticlesState, shuffleState } from '../../Recoil/ReadWrite';
import { isPlaylist, SortSongList } from '../../Tools';
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
  const playlists = useRecoilValue(playlistNamesState);
  const nowPlaying = useRecoilValue(activePlaylistState);
  const songList = useRecoilValue(songListState);
  const saveEnabled = useRecoilValue(saveableState);

  const [showSaveAs, saveAsData] = useDialogState();
  const [showConfirm, confirmData] = useDialogState();

  const saveListAs = useRecoilCallback(({ set }) => (inputName: string) => {
    if (playlists.has(inputName)) {
      window.alert("Sorry: You can't overwrite an existing playlist.");
    } else {
      set(getPlaylistState(inputName), [...songList]);
      set(activePlaylistState, inputName);
    }
  });
  const stopAndClear = useRecoilCallback((cbInterface) => () => {
    StopAndClear(cbInterface);
  });
  const clickClearQueue = useRecoilCallback((cbInterface) => () => {
    if (isPlaylist(nowPlaying)) {
      StopAndClear(cbInterface);
    } else {
      showConfirm();
    }
  });
  const save = useRecoilCallback(({ set }) => () => {
    set(getPlaylistState(nowPlaying), songList);
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
      <Stack id="nowPlayingSticky" styles={stackStyles}>
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
  const albums: Map<AlbumKey, Album> = useRecoilValue(allAlbumsState);
  const artists: Map<ArtistKey, Artist> = useRecoilValue(allArtistsState);
  const articles = useRecoilValue(ignoreArticlesState);
  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailState, item),
  );
  const [curIndex, setCurIndex] = useRecoilState(currentIndexState);
  const [songList, setSongList] = useRecoilState(songListState);
  const resetShuffle = useResetRecoilState(shuffleState);
  const [sortBy, setSortBy] = useRecoilState(nowPlayingSortState);
  const curSongs = useRecoilValue(curSongsState);

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
      const sortedSongs = SortSongList(
        curSongs,
        albums,
        artists,
        articles,
        srt,
      );
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
          getKey={(item: any, index?: number) => {
            const sng = item as Song;
            const idx = index !== undefined ? index : -1;
            return `${sng.key}:${idx}`;
          }}
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
