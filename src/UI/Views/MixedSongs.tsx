import {
  DetailsList,
  IDetailsRowProps,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
} from '@fluentui/react';
import { MakeLog } from '@freik/logger';
import { Song, SongKey } from '@freik/media-core';
import { isNumber } from '@freik/typechk';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';
import { AddSongs } from '../../Jotai/API';
import { useJotaiCallback } from '../../Jotai/Helpers';
import {
  isSongHatedFam,
  isSongLikedFam,
  songListLikeNumberFromStringFam,
} from '../../Jotai/LikesAndHates';
import { ignoreArticlesState } from '../../Jotai/SimpleSettings';
import { getStore } from '../../Jotai/Storage';
import {
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  dataForSongListFuncFam,
} from '../../Recoil/ReadOnly';
import { MakeSortKey, SortSongList } from '../../Sorting';
import {
  AlbumForSongRender,
  ArtistsForSongRender,
  YearForSongRender,
} from '../SimpleTags';
import {
  MakeColumns,
  StickyRenderDetailsHeader,
  altRowRenderer,
} from '../SongList';
import { SongListMenu, SongListMenuData } from '../SongMenus';

import './styles/MixedSongs.css';

const { wrn } = MakeLog('EMP:render:MixedSongs');

const sortOrderState = atom({
  key: 'mixedSongSortOrder',
  default: MakeSortKey([''], ['nrlyt']),
});
const sortedSongsState = selector({
  key: 'msSorted',
  get: async ({ get }) => {
    const store = getStore();
    return SortSongList(
      [...get(allSongsFunc).values()],
      get(allAlbumsFunc),
      get(allArtistsFunc),
      await store.get(ignoreArticlesState),
      get(sortOrderState),
    );
  },
});
const songContextState = atom<SongListMenuData>({
  key: 'mixedSongContext',
  default: { data: '', spot: { left: 0, top: 0 } },
});

function Liker({ songId }: { songId: SongKey }): JSX.Element {
  const likeNum = useAtomValue(songListLikeNumberFromStringFam(songId));
  const strings = ['⋯', '👍', '👎', '⋮'];
  const onClick = useJotaiCallback(
    (get, set) => {
      switch (likeNum) {
        case 0: // neutral
          set(isSongLikedFam(songId), true);
          break;
        case 1: // like
          set(isSongHatedFam(songId), true);
          break;
        case 2: // hate
          set(isSongHatedFam(songId), false);
          break;
        case 3: // mixed
          set(isSongLikedFam(songId), false);
          set(isSongHatedFam(songId), false);
          break;
      }
    },
    [songId, likeNum],
  );
  return <div onClick={onClick}>{strings[likeNum]}</div>;
}

// This is a function, and not a React Function Component, so you can't
// have state in it: Gotta wrap it. Kinda weird, but whatever...
export function LikeOrHate(song: Song): JSX.Element {
  return <Liker songId={song.key} />;
}

export function MixedSongsList(): JSX.Element {
  const sortedItems = useRecoilValue(sortedSongsState);
  const [sortOrder, setSortOrder] = useRecoilState(sortOrderState);
  const onAddSongClick = useCallback(
    (item: Song) => AddSongs([item.key]).catch(wrn),
    [],
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
      ['r', 'artistIds', 'Artist(s)', 150, 450, ArtistsForSongRender],
      ['l', 'albumId', 'Album', 150, 450, AlbumForSongRender],
      ['y', 'albumId', 'Year', 45, 45, YearForSongRender],
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
          onGetSongList={(_xact, data) => (data.length > 0 ? [data] : [])}
        />
      </ScrollablePane>
    </div>
  );
}

export function SimpleSongsList({
  forSongs,
  bold,
  keyprefix,
}: {
  forSongs: SongKey[];
  bold?: (props: IDetailsRowProps) => boolean;
  keyprefix?: string;
}): JSX.Element {
  const pfx = keyprefix || 'ssl';
  const songList = useRecoilValue(dataForSongListFuncFam(forSongs));
  if (!songList) {
    return <></>;
  }
  const rl = songList
    .map((val) => val.artist.length)
    .reduce((pv, cv) => Math.max(pv, cv), 1);
  const ll = songList
    .map((val) => val.album.length)
    .reduce((pv, cv) => Math.max(pv, cv), 1);
  const nl = songList
    .map((val) => val.track.toString().length)
    .reduce((pv, cv) => Math.max(pv, cv), 1);
  const tl = songList
    .map((val) => val.title.length)
    .reduce((pv, cv) => Math.max(pv, cv), 1);
  const tot = rl + ll + nl + tl;
  return (
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
            minWidth: (50 * nl) / tot,
            maxWidth: (50 * nl) / tot,
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
        onRenderRow={altRowRenderer(bold ? bold : () => false)}
        getKey={(item: any, index?: number) =>
          `${pfx}${isNumber(index) ? forSongs[index] : 'ERROR!'}`
        }
      />
    </div>
  );
}
