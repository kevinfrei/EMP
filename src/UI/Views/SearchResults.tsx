import React, { CSSProperties } from 'react';
import { VerticalScrollVariableVirtualList } from '../Scrollables';

export default function SearchResultsView(): JSX.Element {
  const searchResults = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  function SearchRowSize(index: number): number {
    return 40 + 10 * (index % 2);
  }
  function VirtualSearchRow(index: number, style: CSSProperties) {
    return (
      <div style={style}>
        index: {index}, value: {searchResults[index]}
      </div>
    );
  }
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
