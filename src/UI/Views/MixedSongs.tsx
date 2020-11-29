import {
  DetailsList,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { MakeError } from '@freik/core-utils';
import { Song } from '@freik/media-utils';
import {
  atom,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { AddSongs } from '../../Recoil/api';
import { songDetailAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
} from '../../Recoil/ReadOnly';
import { ignoreArticlesAtom } from '../../Recoil/ReadWrite';
import { SortSongList } from '../../Tools';
import {
  AlbumFromSong,
  altRowRenderer,
  ArtistsFromSong,
  MakeColumns,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/MixedSongs.css';

const err = MakeError('MixedSongs-err'); // eslint-disable-line

const sortOrderAtom = atom({ key: 'mixedSongSortOrder', default: 'rl' });
const sortedSongsSel = selector({
  key: 'msSorted',
  get: ({ get }) => {
    return SortSongList(
      [...get(allSongsSel).values()],
      get(allAlbumsSel),
      get(allArtistsSel),
      get(ignoreArticlesAtom),
      get(sortOrderAtom),
    );
  },
});

export default function MixedSongsList(): JSX.Element {
  const sortedItems = useRecoilValue(sortedSongsSel);

  const [sortOrder, setSortOrder] = useRecoilState(sortOrderAtom);

  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailAtom, item),
  );
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
