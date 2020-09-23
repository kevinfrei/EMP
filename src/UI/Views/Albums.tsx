// eslint-disable-next-line @typescript-eslint/no-use-before-define
import { DetailsList, SelectionMode } from '@fluentui/react';
import { Album } from '@freik/media-utils';
import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddSongList } from '../../Recoil/api';
import { currentIndexAtom, songListAtom } from '../../Recoil/Local';
import { allAlbumsSel } from '../../Recoil/ReadOnly';
import { ArtistsFromAlbum, makeColumns } from '../SongList';
import './styles/Albums.css';

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
    <div>
      <FocusZone>
        <SelectionZone selection={selection} selectionMode={SelectionMode.multiple}>
          <GroupedList
            items={items}
            onRenderCell={onRenderCell}
            selection={selection}
            selectionMode={SelectionMode.multiple}
            groups={groups}
            groupProps={groupProps}
          />
        </SelectionZone>
      </FocusZone>
    </div>
  );
};

*/
export default function NewAlbumView(): JSX.Element {
  const allAlbums = useRecoilValue(allAlbumsSel);
  const [curIndex, setCurIndex] = useRecoilState(currentIndexAtom);
  const [songList, setSongList] = useRecoilState(songListAtom);
  const albums = [...allAlbums.values()];
  const columns = makeColumns<Album>(
    // TODO: Get the sorting in place
    () => '',
    () => {
      ' ';
    },
    ['r', 'primaryArtists', 'Artist', 50, 250, ArtistsFromAlbum],
    ['l', 'title', 'Album Title', 50, 250],
  );
  return (
    <div className="current-view songListForAlbum" data-is-scrollable="true">
      <DetailsList
        items={albums}
        selectionMode={SelectionMode.none}
        columns={columns}
        onItemInvoked={(item: Album) =>
          AddSongList(item.songs, curIndex, setCurIndex, songList, setSongList)
        }
      />
    </div>
  );
}
