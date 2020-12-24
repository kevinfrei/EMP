import {
  DetailsList,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { MakeError, Song, SongKey } from '@freik/core-utils';
import {
  atom,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { AddSongs } from '../../Recoil/api';
import {
  allAlbumsState,
  allArtistsState,
  allSongsState,
  getDataForSongListState,
} from '../../Recoil/ReadOnly';
import { ignoreArticlesState } from '../../Recoil/ReadWrite';
import { SortSongList } from '../../Tools';
import { SongDetailContextMenuClick } from '../SongDetailPanel';
import {
  AlbumFromSong,
  altRowRenderer,
  ArtistsFromSong,
  MakeColumns,
  StickyRenderDetailsHeader,
} from '../SongList';
import { Expandable } from '../Utilities';
import './styles/MixedSongs.css';

const err = MakeError('MixedSongs-err'); // eslint-disable-line

const sortOrderState = atom({ key: 'mixedSongSortOrder', default: 'rl' });
const sortedSongsState = selector({
  key: 'msSorted',
  get: ({ get }) => {
    return SortSongList(
      [...get(allSongsState).values()],
      get(allAlbumsState),
      get(allArtistsState),
      get(ignoreArticlesState),
      get(sortOrderState),
    );
  },
});

export default function MixedSongsList(): JSX.Element {
  const sortedItems = useRecoilValue(sortedSongsState);
  const [sortOrder, setSortOrder] = useRecoilState(sortOrderState);
  const onSongDetailClick = useRecoilCallback(SongDetailContextMenuClick);
  const onAddSongClick = useRecoilCallback((cbInterface) => (item: Song) =>
    AddSongs([item.key], cbInterface),
  );

  const columns = MakeColumns(
    [
      ['n', 'track', '#', 30, 30],
      ['r', 'artistIds', 'Artists(s)', 150, 450, ArtistsFromSong],
      ['l', 'albumId', 'Album', 150, 450, AlbumFromSong],
      ['t', 'title', 'Title', 150],
    ],
    () => sortOrder,
    setSortOrder,
  );
  return (
    <div className="songView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
        <DetailsList
          items={sortedItems}
          columns={columns}
          compact={true}
          selectionMode={SelectionMode.none}
          onRenderRow={altRowRenderer()}
          onRenderDetailsHeader={StickyRenderDetailsHeader}
          onItemContextMenu={onSongDetailClick}
          onItemInvoked={onAddSongClick}
        />
      </ScrollablePane>
    </div>
  );
}

export function SimpleSongsList({
  forSongs,
}: {
  forSongs: SongKey[];
}): JSX.Element {
  const songList = useRecoilValue(getDataForSongListState(forSongs));
  if (!songList) {
    return <></>;
  }
  return (
    <Expandable label="Files Selected">
      <div>
        <DetailsList
          items={songList}
          columns={[
            {
              key: 'r',
              fieldName: 'artist',
              name: 'Artist',
              minWidth: 50,
              maxWidth: 150,
              isResizable: true,
            },
            {
              key: 'l',
              fieldName: 'album',
              name: 'Album',
              minWidth: 50,
              maxWidth: 150,
              isResizable: true,
            },
            {
              key: 'n',
              fieldName: 'track',
              name: '#',
              minWidth: 15,
              maxWidth: 25,
              isResizable: true,
            },
            {
              key: 't',
              fieldName: 'title',
              name: 'Title',
              minWidth: 50,
              maxWidth: 150,
              isResizable: true,
            },
          ]}
          compact={true}
          selectionMode={SelectionMode.none}
          onRenderRow={altRowRenderer()}
        />
      </div>
    </Expandable>
  );
}
