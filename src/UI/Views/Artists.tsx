// eslint-disable-next-line @typescript-eslint/no-use-before-define
import {
  DetailsList,
  DetailsRow,
  Dialog,
  DialogType,
  GroupedList,
  IColumn,
  IGroup,
  SelectionMode,
} from '@fluentui/react';
import { Artist, Song } from '@freik/media-utils';
import React, { CSSProperties, ReactNode, useState } from 'react';
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

/*
https://developer.microsoft.com/en-us/fluentui#/controls/web/groupedlist

import * as React from 'react';
import {
  GroupHeader,
  GroupedList,
  IGroupHeaderCheckboxProps,
  IGroupHeaderProps,
  IGroupRenderProps,
} from 'office-ui-fabric-react/lib/GroupedList';
import { IColumn, IObjectWithKey, DetailsRow } from 'office-ui-fabric-react/lib/DetailsList';
import { FocusZone } from 'office-ui-fabric-react/lib/FocusZone';
import { Selection, SelectionMode, SelectionZone } from 'office-ui-fabric-react/lib/Selection';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { useConst } from '@uifabric/react-hooks';
import { createListItems, createGroups, IExampleItem } from '@uifabric/example-data';

const groupCount = 3;
const groupDepth = 1;

const groupProps: IGroupRenderProps = {
  onRenderHeader: (props?: IGroupHeaderProps): JSX.Element => (
    <GroupHeader onRenderGroupHeaderCheckbox={onRenderGroupHeaderCheckbox} {...props} />
  ),
};

const onRenderGroupHeaderCheckbox = (props?: IGroupHeaderCheckboxProps) => (
  <Toggle checked={props ? props.checked : undefined} />
);

export const GroupedListCustomCheckboxExample: React.FunctionComponent = () => {
  const items: IObjectWithKey[] = useConst(() => createListItems(Math.pow(groupCount, groupDepth + 1)));
  const groups = useConst(() => createGroups(groupCount, groupDepth, 0, groupCount));
  const columns = useConst(() =>
    Object.keys(items[0])
      .slice(0, 3)
      .map(
        (key: string): IColumn => ({
          key: key,
          name: key,
          fieldName: key,
          minWidth: 300,
        }),
      ),
  );
  const selection = useConst(() => new Selection({ items }));

  const onRenderCell = React.useCallback(
    (nestingDepth?: number, item?: IExampleItem, itemIndex?: number): React.ReactNode => (
      <DetailsRow
        columns={columns}
        groupNestingDepth={nestingDepth}
        item={item}
        itemIndex={itemIndex!}
        selection={selection}
        selectionMode={SelectionMode.multiple}
      />
    ),
    [columns, selection],
  );

  return (
          <GroupedList
            items={items}
            onRenderCell={onRenderCell}
            selection={selection}
            selectionMode={SelectionMode.multiple}
            groups={groups}
            groupProps={groupProps}
          />
  );
};
*/
function NewArtistList(): JSX.Element {
  const allSongsMap = useRecoilValue(allSongsSel);
  const allArtists = useRecoilValue(allArtistsSel);
  const allSongs = [...allSongsMap.values()];
  const artistGroups: IGroup[] = [];
  const columns: IColumn[] = [];
  // const nestingDepth = 1;
  const onRenderCell = React.useCallback(
    (nestingDepth?: number, item?: Song, index?: number): ReactNode => {
      if (nestingDepth === null || item === null || index === null)
        return <></>;
      return <DetailsRow columns={columns} item={item} itemIndex={index!} />;
    },
    [columns],
  );
  return (
    <GroupedList
      items={allSongs}
      groups={artistGroups}
      onRenderCell={onRenderCell}
    />
  );
}
