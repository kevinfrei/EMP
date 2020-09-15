// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState } from 'react';
import {
  DetailsList,
  Dialog,
  DialogType,
  SelectionMode,
} from '@fluentui/react';
import { useRecoilValue, useRecoilState } from 'recoil';

import {
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
} from '../../Recoil/MusicDbAtoms';
import { addSongAtom } from '../../Recoil/api';
import { SortSongs } from '../../Sorters';
import { sortWithArticles } from '../../Recoil/SettingsAtoms';
import { renderAltRow, makeColumns, ArtistName, AlbumName } from '../SongList';
import MediaInfoTable from '../MediaInfo';

import type {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '../../DataSchema';

import './styles/MixedSongs.css';

export default function MixedSongsList(): JSX.Element {
  const songs: Map<SongKey, Song> = useRecoilValue(allSongsSel);
  const albums: Map<AlbumKey, Album> = useRecoilValue(allAlbumsSel);
  const artists: Map<ArtistKey, Artist> = useRecoilValue(allArtistsSel);
  const articles = useRecoilValue(sortWithArticles.atom);
  const [selected, setSelected] = useState('');
  const [, addSong] = useRecoilState(addSongAtom);
  const [sortOrder, setSortOrder] = useState('rl');
  const [sortedItems, setSortedItems] = useState(
    SortSongs(sortOrder, [...songs.values()], albums, artists, articles),
  );

  const artName = (item: Song) => <ArtistName artists={item.artistIds} />;
  const albName = (item: Song) => <AlbumName albumId={item.albumId} />;

  const columns = makeColumns(
    () => sortOrder,
    (srt: string) => {
      setSortOrder(srt);
      setSortedItems(SortSongs(srt, sortedItems, albums, artists, articles));
    },
    ['n', 'track', '#', 30, 30],
    ['r', 'artistIds', 'Artists(s)', 150, 450, artName],
    ['l', 'albumId', 'Album', 150, 450, albName],
    ['t', 'title', 'Title', 150],
  );

  return (
    <div className="songView current-view" data-is-scrollable="true">
      <Dialog
        minWidth={450}
        hidden={selected === ''}
        onDismiss={() => setSelected('')}
        dialogContentProps={{ type: DialogType.close, title: 'Metadata' }}
      >
        <MediaInfoTable forSong={selected} />
      </Dialog>
      <DetailsList
        compact={true}
        items={sortedItems}
        selectionMode={SelectionMode.none}
        onRenderRow={renderAltRow}
        onItemContextMenu={(item: Song) => {
          setSelected(item.key);
        }}
        columns={columns}
        onItemInvoked={(item: Song) => addSong(item.key)}
      />
    </div>
  );
}
