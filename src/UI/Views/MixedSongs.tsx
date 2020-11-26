import {
  DetailsList,
  IDetailsList,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import { Song } from '@freik/media-utils';
import { useState } from 'react';
import {
  atom,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { AddSongs } from '../../Recoil/api';
import { keyFilterAtom, songDetailAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
} from '../../Recoil/ReadOnly';
import {
  CurrentView,
  curViewAtom,
  ignoreArticlesAtom,
} from '../../Recoil/ReadWrite';
import { GetIndexOf, noArticles, SortSongList } from '../../Tools';
import {
  AlbumFromSong,
  altRowRenderer,
  ArtistsFromSong,
  MakeColumns,
  StickyRenderDetailsHeader,
} from '../SongList';
import './styles/MixedSongs.css';

const log = MakeLogger('MixedSongs');

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
  const keyFilter = useRecoilValue(keyFilterAtom);
  const ignoreArticles = useRecoilValue(ignoreArticlesAtom);
  const curView = useRecoilValue(curViewAtom);
  const sortedItems = useRecoilValue(sortedSongsSel);

  const [sortOrder, setSortOrder] = useRecoilState(sortOrderAtom);

  const onSongDetailClick = useRecoilCallback(({ set }) => (item: Song) =>
    set(songDetailAtom, item),
  );
  const onAddSongClick = useRecoilCallback((cbInterface) => (item: Song) =>
    AddSongs([item.key], cbInterface),
  );

  const [detailRef, setDetailRef] = useState<IDetailsList | null>(null);

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
  if (curView === CurrentView.song && detailRef && keyFilter.length > 0) {
    const index = GetIndexOf<Song>(sortedItems, keyFilter, (s: Song) =>
      ignoreArticles ? noArticles(s.title) : s.title,
    );
    detailRef.focusIndex(index);
    log(`Filter:'${keyFilter}' #${index} name:${sortedItems[index].title}`);
  }
  return (
    <div className="songView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
        <DetailsList
          componentRef={(ref) => setDetailRef(ref)}
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
