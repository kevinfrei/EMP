import {
  DetailsList,
  Dialog,
  DialogType,
  IDetailsColumnRenderTooltipProps,
  IDetailsHeaderProps,
  IRenderFunction,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  Sticky,
  StickyPositionType,
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
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddSongList } from '../../Recoil/api';
import { currentIndexAtom, songListAtom } from '../../Recoil/Local';
import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
} from '../../Recoil/ReadOnly';
import { sortWithArticlesAtom } from '../../Recoil/ReadWrite';
import { SortSongs } from '../../Tools';
import MediaInfoTable from '../MediaInfo';
import {
  AlbumFromSong,
  ArtistsFromSong,
  makeColumns,
  renderAltRow,
} from '../SongList';
import './styles/MixedSongs.css';

export default function MixedSongsList(): JSX.Element {
  const songs: Map<SongKey, Song> = useRecoilValue(allSongsSel);
  const albums: Map<AlbumKey, Album> = useRecoilValue(allAlbumsSel);
  const artists: Map<ArtistKey, Artist> = useRecoilValue(allArtistsSel);
  const articles = useRecoilValue(sortWithArticlesAtom);
  const curIndexState = useRecoilState(currentIndexAtom);
  const songListState = useRecoilState(songListAtom);
  const [selected, setSelected] = useState('');
  const [sortOrder, setSortOrder] = useState('rl');
  const [sortedItems, setSortedItems] = useState(
    SortSongs(sortOrder, [...songs.values()], albums, artists, articles),
  );

  const columns = makeColumns<Song>(
    () => sortOrder,
    (srt: string) => {
      setSortOrder(srt);
      setSortedItems(SortSongs(srt, sortedItems, albums, artists, articles));
    },
    '',
    ['n', 'track', '#', 30, 30],
    ['r', 'artistIds', 'Artists(s)', 150, 450, ArtistsFromSong],
    ['l', 'albumId', 'Album', 150, 450, AlbumFromSong],
    ['t', 'title', 'Title', 150],
  );
  const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (
    props,
    defaultRender,
  ) => {
    if (!props) {
      return null;
    }
    const onRenderColumnHeaderTooltip: IRenderFunction<IDetailsColumnRenderTooltipProps> = (
      tooltipHostProps,
    ) => <TooltipHost {...tooltipHostProps} />;
    return (
      <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
        {defaultRender!({
          ...props,
          onRenderColumnHeaderTooltip,
        })}
      </Sticky>
    );
  };
  return (
    <div className="current-view songView" data-is-scrollable="true">
      <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
        <Dialog
          minWidth={450}
          hidden={selected === ''}
          onDismiss={() => setSelected('')}
          dialogContentProps={{ type: DialogType.close, title: 'Metadata' }}
        >
          <MediaInfoTable forSong={selected} />
        </Dialog>
        <DetailsList
          items={sortedItems}
          columns={columns}
          compact={true}
          selectionMode={SelectionMode.none}
          onRenderRow={renderAltRow}
          onRenderDetailsHeader={onRenderDetailsHeader}
          onItemContextMenu={(item: Song) => {
            setSelected(item.key);
          }}
          onItemInvoked={(item: Song) =>
            AddSongList([item.key], curIndexState, songListState)
          }
        />
      </ScrollablePane>
    </div>
  );
}
