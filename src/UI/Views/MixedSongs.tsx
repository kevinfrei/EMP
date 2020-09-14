// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState } from 'react';
import {
  DetailsList,
  DetailsRow,
  Dialog,
  DialogType,
  getTheme,
  IColumn,
  IDetailsListProps,
  IDetailsRowStyles,
  SelectionMode,
} from '@fluentui/react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { Logger } from '@freik/core-utils';

import { getMediaInfo } from '../../Recoil/Atoms';
import {
  albumByKeySel,
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
  artistStringSel,
} from '../../Recoil/MusicDbAtoms';
import { addSongAtom } from '../../Recoil/api';
import { SortSongs } from '../../Sorters';

import type {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '../../MyStore';
import type { MediaInfo } from '../../Recoil/Atoms';

import './styles/MixedSongs.css';
import { sortWithArticles } from '../../Recoil/SettingsAtoms';

const log = Logger.bind('MixedSongs');
Logger.enable('MixedSongs');

function mediaInfoToLine(keyPrefix: string, strs: Map<string, string>) {
  const lines: JSX.Element[] = [];
  log(keyPrefix);
  log(strs);
  strs.forEach((val, key) =>
    lines.push(
      <tr key={keyPrefix + key}>
        <td>{key}</td>
        <td colSpan={3}>{val}</td>
      </tr>,
    ),
  );
  return lines;
}

function MediaInfoTable({ id }: { id: string }) {
  const mediaInfo: MediaInfo = useRecoilValue(getMediaInfo(id));
  if (mediaInfo) {
    log('Here we are');
    log(mediaInfo);
    const genLines = mediaInfoToLine('gen', mediaInfo.general);
    log('Here we are again');
    const audLines = mediaInfoToLine('aud', mediaInfo.audio);
    return (
      <table>
        <thead>
          <tr>
            <td>General</td>
          </tr>
        </thead>
        <tbody>{genLines}</tbody>
        <thead>
          <tr>
            <td>Audio</td>
          </tr>
        </thead>
        <tbody>{audLines}</tbody>
      </table>
    );
  } else {
    return <></>;
  }
}

const theme = getTheme();

function ArtistName({ artists }: { artists: ArtistKey[] }) {
  return <>{useRecoilValue(artistStringSel(artists))}</>;
}

function AlbumName({ albumId }: { albumId: AlbumKey }) {
  return <>{useRecoilValue(albumByKeySel(albumId)).title}</>;
}

export default function MixedSongsList(): JSX.Element {
  const songs: Map<SongKey, Song> = useRecoilValue(allSongsSel);
  const albums: Map<AlbumKey, Album> = useRecoilValue(allAlbumsSel);
  const artists: Map<ArtistKey, Artist> = useRecoilValue(allArtistsSel);
  const articles = useRecoilValue(sortWithArticles.atom);
  const [selected, setSelected] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [, addSong] = useRecoilState(addSongAtom);
  const [sortedItems, setSortedItems] = useState([...songs.values()]);
  const [sortOrder, setSortOrder] = useState('');

  const setSort = (which: string) => {
    // This rearranges the sort order string
    let sort = which;
    // Handle clicking twice to invert the order
    const flip = sortOrder.toLowerCase().startsWith(which);
    if (flip && sortOrder[0] === which) {
      sort = sort.toUpperCase();
    }
    const newSort = sortOrder
      .replaceAll(which.toLowerCase(), '')
      .replaceAll(which.toUpperCase(), '');
    // set the sort order
    setSortOrder(sort + newSort);
    // TODO: Actually sort the values
    setSortedItems(
      SortSongs(sort + newSort, sortedItems, albums, artists, articles),
    );
  };

  const makeColumn = (
    name: string,
    fieldName: string,
    minWidth: number,
    maxWidth: number,
    key: string,
    render?: (item: Song) => JSX.Element,
  ) => ({
    key,
    name,
    fieldName,
    minWidth,
    maxWidth,
    isResizable: true,
    isSorted: sortOrder.toLocaleLowerCase().startsWith(key),
    isSortedDescending: sortOrder.startsWith(key.toUpperCase()),
    onColumnClick: () => setSort(key),
    onRender: render,
  });
  const columns: IColumn[] = [
    makeColumn('#', 'track', 30, 30, 'n'),
    makeColumn('Artist(s)', 'artistIds', 150, 450, 'r', (item: Song) => (
      <ArtistName artists={item.artistIds} />
    )),
    makeColumn('Album', 'albumId', 150, 450, 'l', (item: Song) => (
      <AlbumName albumId={item.albumId} />
    )),
    makeColumn('Title', 'title', 150, 450, 't'),
  ];

  const renderRow: IDetailsListProps['onRenderRow'] = (props) => {
    const customStyles: Partial<IDetailsRowStyles> = {};
    if (props) {
      if (props.itemIndex % 2 === 0) {
        // Every other row renders with a different background color
        customStyles.root = { backgroundColor: theme.palette.themeLighterAlt };
      }
      return <DetailsRow {...props} styles={customStyles} />;
    }
    return null;
  };

  return (
    <div className="songView current-view" data-is-scrollable="true">
      <Dialog
        minWidth={450}
        maxWidth={750}
        hidden={!showDialog}
        onDismiss={() => setShowDialog(false)}
        dialogContentProps={{ type: DialogType.close, title: 'Metadata' }}
      >
        <MediaInfoTable id={selected} />
      </Dialog>
      <DetailsList
        compact={true}
        items={sortedItems}
        selectionMode={SelectionMode.none}
        onRenderRow={renderRow}
        onItemContextMenu={(item: Song) => {
          setSelected(item.key);
          setShowDialog(true);
        }}
        columns={columns}
        onItemInvoked={(item: Song) => addSong(item.key)}
      />
    </div>
  );
}
