// @flow

import React, { CSSProperties } from 'react';
import Card from 'react-bootstrap/Card';

import Store from '../MyStore';

import { AddArtist } from '../Playlist';
import { VerticalScrollVariableVirtualList } from '../Scrollables';

import type { Properties } from 'csstype';

export default function SearchResultsView() {
  const store = Store.useStore();
  const searchResults = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const SearchRowSize = (index: number): number => {
    return 40 + 10 * (index & 1);
  };
  const VirtualSearchRow = (index: number, style: CSSProperties) => {
    return (
      <div style={style}>
        index: {index}, value: {searchResults[index]}
      </div>
    );
  };
  return (
    <VerticalScrollVariableVirtualList
      scrollId="SearchScrollId"
      itemCount={searchResults.length}
      estimatedItemSize={45}
      itemSizeGenerator={SearchRowSize}
      itemGenerator={VirtualSearchRow}
    />
  );
}
