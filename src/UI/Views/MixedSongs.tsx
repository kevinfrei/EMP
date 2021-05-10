import {
  DetailsList,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { MakeError } from '@freik/core-utils';
import { Song, SongKey } from '@freik/media-core';
import {
  atom,
  CallbackInterface,
  selector,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { AddSongs } from '../../Recoil/api';
import {
  songHateFamily,
  songLikeFamily,
  songLikeNumFromStringFamily,
} from '../../Recoil/Likes';
import {
  allAlbumsState,
  allArtistsState,
  allSongsState,
  getDataForSongListFamily,
} from '../../Recoil/ReadOnly';
import { ignoreArticlesState } from '../../Recoil/ReadWrite';
import { SortSongList } from '../../Tools';
import {
  AlbumFromSongRender,
  altRowRenderer,
  ArtistsFromSongRender,
  MakeColumns,
  StickyRenderDetailsHeader,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';
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
const songContextState = atom<SongListMenuData>({
  key: 'songContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

export function Liker({ songId }: { songId: SongKey }): JSX.Element {
  const likeNum = useRecoilValue(songLikeNumFromStringFamily(songId));
  const strings = ['⋯', '👍', '👎', '⋮'];
  const onClick = useRecoilCallback(({ set }) => () => {
    switch (likeNum) {
      case 0: // neutral
        set(songLikeFamily(songId), true);
        break;
      case 1: // like
        set(songHateFamily(songId), true);
        break;
      case 2: // hate
        set(songHateFamily(songId), false);
        break;
      case 3: // mixed
        set(songLikeFamily(songId), false);
        set(songHateFamily(songId), false);
        break;
    }
  });
  return <div onClick={onClick}>{strings[likeNum]}</div>;
}

// This is a function, and not a React Function Component, so you can't
// have state in it: Gotta wrap it. Kinda weird, but whatever...
export function LikeOrHate(song: Song): JSX.Element {
  return <Liker songId={song.key} />;
}

export default function MixedSongsList(): JSX.Element {
  const sortedItems = useRecoilValue(sortedSongsState);
  const [sortOrder, setSortOrder] = useRecoilState(sortOrderState);
  const onAddSongClick = useRecoilCallback(
    (cbInterface) => (item: Song) => AddSongs(cbInterface, [item.key]),
  );
  const [songContext, setSongContext] = useRecoilState(songContextState);
  const onRightClick = (item?: Song, index?: number, ev?: Event) => {
    const event = ev as any as MouseEvent;
    if (ev && item) {
      setSongContext({
        data: item.key,
        spot: { left: event.clientX + 14, top: event.clientY },
      });
    }
  };
  const columns = MakeColumns(
    [
      ['n', 'track', '#', 30, 30],
      ['r', 'artistIds', 'Artists(s)', 150, 450, ArtistsFromSongRender],
      ['l', 'albumId', 'Album', 150, 450, AlbumFromSongRender],
      ['t', 'title', 'Title', 150],
      ['', '', '👎/👍', 35, 35, LikeOrHate],
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
          onItemContextMenu={onRightClick}
          onItemInvoked={onAddSongClick}
        />
        <SongListMenu
          context={songContext}
          onClearContext={() =>
            setSongContext({ data: '', spot: { left: 0, top: 0 } })
          }
          onGetSongList={(cbInterface: CallbackInterface, data: string) => {
            if (data.length > 0) {
              return [data];
            }
          }}
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
  const songList = useRecoilValue(getDataForSongListFamily(forSongs));
  if (!songList) {
    return <></>;
  }
  const rl = songList
    .map((val) => val.artist.length)
    .reduce((pv, cv) => Math.max(pv, cv));
  const ll = songList
    .map((val) => val.album.length)
    .reduce((pv, cv) => Math.max(pv, cv));
  const nl = songList
    .map((val) => val.track.toString().length)
    .reduce((pv, cv) => Math.max(pv, cv));
  const tl = songList
    .map((val) => val.title.length)
    .reduce((pv, cv) => Math.max(pv, cv));
  const tot = rl + ll + nl + tl;
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
              minWidth: (100 * rl) / tot,
              maxWidth: (400 * rl) / tot,
              isResizable: true,
            },
            {
              key: 'l',
              fieldName: 'album',
              name: 'Album',
              minWidth: (100 * ll) / tot,
              maxWidth: (400 * ll) / tot,
              isResizable: true,
            },
            {
              key: 'n',
              fieldName: 'track',
              name: '#',
              minWidth: (100 * nl) / tot,
              maxWidth: (400 * nl) / tot,
              isResizable: true,
            },
            {
              key: 't',
              fieldName: 'title',
              name: 'Title',
              minWidth: (100 * tl) / tot,
              maxWidth: (400 * tl) / tot,
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
