// eslint-disable-next-line @typescript-eslint/no-use-before-define
import {
  DetailsList,
  Dialog,
  DialogType,
  SelectionMode,
} from '@fluentui/react';
import { Artist, Song } from '@freik/media-utils';
import React, { CSSProperties, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddSongList } from '../../Recoil/api';
import { currentIndexAtom, songListAtom } from '../../Recoil/Local';
import { allArtistsSel, allSongsSel } from '../../Recoil/ReadOnly';
import { VerticalScrollFixedVirtualList } from '../Scrollables';
import { AlbumFromSong, makeColumns } from '../SongList';
import './styles/Artists.css';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const downChevron = require('../img/down-chevron.svg') as string;

export default function ArtistView(): JSX.Element {
  const artists = useRecoilValue(allArtistsSel);
  const artistArray: Artist[] = [...artists.values()];
  const allSongs = useRecoilValue(allSongsSel);
  const [curIndex, setCurIndex] = useRecoilState(currentIndexAtom);
  const [songList, setSongList] = useRecoilState(songListAtom);
  const [expandedArtist, setExpandedArtist] = useState('');

  const handleClose = () => setExpandedArtist('');

  function VirtualArtistRow({
    index,
    style,
  }: {
    index: number;
    style: CSSProperties;
  }): JSX.Element {
    const artist: Artist = artistArray[index];
    if (!artist) {
      return <div>{`Error for element ${index}`}</div>;
    }
    return (
      <div
        className="artistContainer"
        style={style}
        onDoubleClick={() =>
          AddSongList(
            artist.songs,
            curIndex,
            setCurIndex,
            songList,
            setSongList,
          )
        }
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
            onItemInvoked={(item: Song) =>
              AddSongList(
                [item.key],
                curIndex,
                setCurIndex,
                songList,
                setSongList,
              )
            }
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
