import {
  DefaultButton,
  DetailsList,
  FontIcon,
  IDetailsHeaderProps,
  IDetailsList,
  ISeparatorStyles,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Separator,
  Sticky,
  StickyPositionType,
  Text,
  TooltipHost,
} from '@fluentui/react';
import { Keys } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-core';
import { isNumber } from '@freik/typechk';
import {
  Dialogs,
  MyTransactionInterface,
  useDialogState,
} from '@freik/web-utils';
import { atom as jatom, useAtom, useAtomValue } from 'jotai';
import { useCallback, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { RemoveSongFromNowPlaying, StopAndClear } from '../../Jotai/API';
import { useJotaiAsyncCallback, useJotaiCallback } from '../../Jotai/Helpers';
import { isMiniplayerState, nowPlayingSortState } from '../../Jotai/Local';
import {
  playlistNamesState,
  playlistStateFamily,
  saveableState,
} from '../../Jotai/PlaylistControl';
import { ignoreArticlesState } from '../../Jotai/SimpleSettings';
import { activePlaylistState } from '../../Jotai/SongPlayback';
import {
  allAlbumsFunc,
  allArtistsFunc,
  curSongsFunc,
} from '../../Recoil/ReadOnly';
import {
  currentSongIndexFunc,
  songListState,
  songPlaybackOrderState,
} from '../../Recoil/SongPlaying';
import { SortKey, SortSongList } from '../../Sorting';
import { isPlaylist } from '../../Tools';
import { GetHelperText } from '../MenuHelpers';
import {
  AlbumForSongRender,
  ArtistsForSongRender,
  YearForSongRender,
} from '../SimpleTags';
import { MakeColumns, altRowRenderer } from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
import { LikeOrHate } from './MixedSongs';
import './styles/NowPlaying.css';

const { wrn } = MakeLog('EMP:render:NowPlaying');

const nowPlayingContextState = jatom<SongListMenuData>({
  data: '',
  spot: { left: 0, top: 0 },
});

// The top line of the Now Playing view: Buttons & dialogs & stuff
function TopLine(): JSX.Element {
  const nowPlaying = useAtomValue(activePlaylistState);
  const songList = useRecoilValue(songListState);
  const saveEnabled = useAtomValue(saveableState);

  const [showSaveAs, saveAsData] = useDialogState();
  const [showConfirm, confirmData] = useDialogState();

  const saveListAs = useJotaiAsyncCallback(
    async (get, set, inputName: string) => {
      const playlists = await get(playlistNamesState);
      if (playlists.includes(inputName)) {
        window.alert("Sorry: You can't overwrite an existing playlist.");
      } else {
        set(playlistStateFamily(inputName), [...songList]);
        set(activePlaylistState, inputName);
      }
    },
    [playlistStateFamily, activePlaylistState],
  );
  const stopAndClear = useCallback(() => StopAndClear().catch(wrn), []);
  const clickClearQueue = useCallback(() => {
    if (isPlaylist(nowPlaying)) {
      StopAndClear().catch(wrn);
    } else {
      showConfirm();
    }
  }, []);
  const save = useJotaiCallback(
    (get, set) => () => {
      set(playlistStateFamily(nowPlaying), songList);
    },
    [],
  );

  const emptyQueue = songList.length === 0;
  const isPL = isPlaylist(nowPlaying);
  const header = isPL ? nowPlaying : 'Now Playing';

  const sepStyle: Partial<ISeparatorStyles> = {
    root: { padding: 0, height: 2 },
  };
  return (
    <div id="current-header">
      <div className="now-playing-header">
        <Dialogs.TextInput
          data={saveAsData}
          onConfirm={saveListAs}
          title="Save Playlist as..."
          text="What would you like the playlist to be named?"
          initialValue={nowPlaying}
          yesText="Save"
          noText="Cancel"
        />
        <Dialogs.ConfirmationDialog
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
          title={GetHelperText(Keys.SavePlaylist)}
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
  if (!theProps || !defaultRender) {
    return null;
  }
  // This makes the header not have a bunch of extra whitespace above the header
  theProps.styles = { root: { padding: '0px' } };
  return (
    <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
      <div
        id="nowPlayingSticky"
        style={{ background: 'white', paddingTop: 0.1 }}
      >
        <TopLine />
        {defaultRender({
          ...theProps,
          onRenderColumnHeaderTooltip: (props) => <TooltipHost {...props} />,
        })}
      </div>
    </Sticky>
  );
}

// The Now Playing (Current playlist) view
export function NowPlayingView(): JSX.Element {
  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);

  const albums: Map<AlbumKey, Album> = useRecoilValue(allAlbumsFunc);
  const artists: Map<ArtistKey, Artist> = useRecoilValue(allArtistsFunc);
  const articles = useAtomValue(ignoreArticlesState);
  const [curIndex, setCurIndex] = useRecoilState(currentSongIndexFunc);
  const [songList, setSongList] = useRecoilState(songListState);
  const [sortBy, setSortBy] = useAtom(nowPlayingSortState);
  const curSongs = useRecoilValue(curSongsFunc);
  const isMini = useAtomValue(isMiniplayerState);
  const [songContext, setSongContext] = useAtom(nowPlayingContextState);
  const [playbackOrder, setPlaybackOrder] = useRecoilState(
    songPlaybackOrderState,
  );
  const onRightClick = (item?: Song, index?: number, ev?: Event) => {
    const event = ev as unknown as MouseEvent;
    if (ev && item) {
      setSongContext({
        data: item.key,
        spot: { left: event.clientX + 14, top: event.clientY },
      });
    }
  };
  const removeSong = useCallback(
    (indexOrKey: number | SongKey) =>
      RemoveSongFromNowPlaying(indexOrKey).catch(wrn),
    [],
  );
  const drawDeleter = (song: Song, index?: number) => (
    <FontIcon
      style={{
        height: '18px',
        width: '18px',
        cursor: 'pointer',
        paddingTop: '2px',
      }}
      iconName="Delete"
      onClick={() => removeSong(isNumber(index) ? index : song.key)}
    />
  );

  const performSort = (srt: SortKey) => {
    setSortBy(srt);
    if (srt.hasSort()) {
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
      if (playbackOrder !== 'ordered') {
        // Remap the shuffled order to the new sort, so we don't reshuffle constantly
        const indexMap = new Map(
          sortedSongs.map((old, index) => [old.index, index]),
        );
        const newOrder = playbackOrder.map((val) => indexMap.get(val) || 0);
        setPlaybackOrder(newOrder);
        setSongList(newSongList);
      } else {
        setSongList(newSongList);
        setCurIndex(newKey);
      }
    }
  };

  const normalColumns = MakeColumns(
    [
      ['X', '', '', 18, 18, drawDeleter],
      ['l', 'albumId', 'Album', 50, 175, AlbumForSongRender],
      ['r', 'artistIds', 'Artist(s)', 50, 150, ArtistsForSongRender],
      ['y', 'albumId', 'Year', 55, 25, YearForSongRender],
      ['n', 'track', '#', 10, 20],
      ['t', 'title', 'Title', 50, 150],
      ['', '', '👎/👍', 35, 35, LikeOrHate],
    ],
    () => sortBy,
    performSort,
  );
  const miniColumns = MakeColumns(
    [
      ['X', '', '', 12, 12, drawDeleter],
      ['t', 'title', 'Title', 60, 100],
      ['l', 'albumId', 'Album', 60, 100, AlbumForSongRender],
    ],
    () => sortBy,
    performSort,
  );
  if (detailRef && curIndex >= 0 && curIndex < curSongs.length) {
    detailRef.focusIndex(curIndex);
  }
  return (
    <div data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
        <DetailsList
          componentRef={(ref) => setDetailRef(ref)}
          compact={true}
          items={curSongs}
          cellStyleProps={{
            cellLeftPadding: isMini ? 4 : 8,
            cellRightPadding: 0,
            cellExtraRightPadding: 0,
          }}
          getKey={(item: any, index?: number) => {
            const sng = item as Song;
            const idx = index !== undefined ? index : -1;
            return `${sng.key}:${idx}`;
          }}
          selectionMode={SelectionMode.none}
          onRenderRow={altRowRenderer((props) => props.itemIndex === curIndex)}
          columns={isMini ? miniColumns : normalColumns}
          onItemContextMenu={onRightClick}
          onItemInvoked={(item, index) => setCurIndex(index ?? -1)}
          onRenderDetailsHeader={StickyDetailsHeader}
        />
        <SongListMenu
          context={songContext}
          onClearContext={() =>
            setSongContext({ data: '', spot: { left: 0, top: 0 } })
          }
          onGetSongList={(_xact: MyTransactionInterface, data: string) =>
            data.length > 0 ? [data] : []
          }
          items={['prop', 'show', '-', 'like', 'hate']}
        />
      </ScrollablePane>
    </div>
  );
}
