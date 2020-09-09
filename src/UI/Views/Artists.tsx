import React, { useState, CSSProperties } from 'react';
import { Dialog, DialogType } from '@fluentui/react';

import Store from '../../MyStore';

import { AddArtist, AddSong } from '../../Playlist';
import { VerticalScrollFixedVirtualList } from '../Scrollables';
import SongLine from '../SongLine';

import './styles/Artists.css';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const downChevron = require('../img/down-chevron.svg') as string;

export default function ArtistView(): JSX.Element {
  const store = Store.useStore();
  const artists = store.get('Artists');
  const [expandedArtist, setExpandedArtist] = useState('');
  const handleClose = () => setExpandedArtist('');

  function VirtualArtistRow({
    index,
    style,
  }: {
    index: number;
    style: CSSProperties;
  }): JSX.Element {
    const artistArray = store.get('ArtistArray');
    const artist = artists.get(artistArray[index]);
    if (!artist) {
      return <div>{`Error for element ${index}`}</div>;
    }
    return (
      <div
        className="artistContainer"
        style={style}
        onDoubleClick={() => AddArtist(store, artist.key)}
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
  let dialogHeader = <></>;
  if (!!expandedArtist) {
    const art = artists.get(expandedArtist);
    if (art) {
      dialogHeader = <>{`Song list for ${art.name}`}</>;
      details = (
        <div className="songListForArtist">
          {art.songs.map((k) => (
            <SongLine
              template="L#T"
              key={k}
              className="songForArtist"
              songKey={k}
              onDoubleClick={AddSong}
            />
          ))}
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
