// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useState, CSSProperties } from 'react';
import {
  DetailsList,
  Dialog,
  DialogType,
  SelectionMode,
} from '@fluentui/react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { VerticalScrollFixedVirtualList } from '../Scrollables';
import { addArtistAtom, addSongAtom } from '../../Recoil/api';
import { allArtistsSel, allSongsSel } from '../../Recoil/ReadOnly';

import type { Artist, Song } from '../../DataSchema';

import './styles/Artists.css';
import { AlbumFromSong, makeColumns } from '../SongList';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const downChevron = require('../img/down-chevron.svg') as string;

export default function ArtistView(): JSX.Element {
  const [, addArtist] = useRecoilState(addArtistAtom);
  const artists = useRecoilValue(allArtistsSel);
  const artistArray: Artist[] = [...artists.values()];
  const allSongs = useRecoilValue(allSongsSel);
  const [expandedArtist, setExpandedArtist] = useState('');

  const [, addSong] = useRecoilState(addSongAtom);

  const handleClose = () => setExpandedArtist('');

  function VirtualArtistRow({
    index,
    style,
  }: {
    index: number;
    style: CSSProperties;
  }): JSX.Element {
    const artist = artistArray[index];
    if (!artist) {
      return <div>{`Error for element ${index}`}</div>;
    }
    return (
      <div
        className="artistContainer"
        style={style}
        onDoubleClick={() => addArtist(artist.key)}
      >
        <div className="artistName">
          {artist.name} &nbsp;
          <img
            onClick={() => setExpandedArtist(artist.key)}
            src={downChevron}
            className="artistChevron"
            alt="expander"
          />
        </div>
        <div className="artistSummary">
          {artist.songs.length} Songs and {artist.albums.length} Albums
        </div>
      </div>
    );
  }

  let details = <></>;
  let dialogHeader = '';
  if (!!expandedArtist) {
    const art = artists.get(expandedArtist);
    if (art) {
      const songColumns = makeColumns<Song>(
        // TODO: Add sorting back
        () => '',
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
        ['l', 'albumId', 'Album', 50, 150, AlbumFromSong],
        ['n', 'track', '#', 10, 40],
        ['t', 'title', 'Title', 50],
      );
      dialogHeader = `Song list for ${art.name}`;
      details = (
        <div className="songListForArtist" data-is-scrollable="true">
          <DetailsList
            compact={true}
            items={art.songs.map((sl) => allSongs.get(sl))}
            selectionMode={SelectionMode.none}
            columns={songColumns}
            onItemInvoked={(item: Song) => addSong(item.key)}
          />
        </div>
      );
    }
  }
  return (
    <div className="artistView">
      <Dialog
        hidden={!expandedArtist}
        onDismiss={handleClose}
        dialogContentProps={{ type: DialogType.close, title: dialogHeader }}
        minWidth={450}
        maxWidth={650}
      >
        {details}
      </Dialog>
      <VerticalScrollFixedVirtualList
        scrollId="ArtistsScrollId"
        itemCount={artists.size}
        itemSize={50}
        itemGenerator={VirtualArtistRow}
      />
    </div>
  );
}
