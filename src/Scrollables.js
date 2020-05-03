// @flow

import React, { useEffect, useRef } from 'react';

import Store from './MyStore';

import './styles/Scrollables.css';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import type { Properties } from 'csstype';

function log(a) {
  console.log('PSP' + a);
}

export function VerticalScrollDiv({
  scrollId,
  children,
  className,
  ...props
}: {
  scrollId: string,
  children: React$Node,
  className?: string,
  props?: Array<Properties<HTMLDivElement>>,
}) {
  let store = Store.useStore();
  const scrollData = store.get('scrollManager');
  const getScrollPosition = (ev) => {
    const pos = { x: ev.target.scrollLeft, y: ev.target.scrollTop };
    if (pos) {
      scrollData.set(scrollId, pos);
    }
  };

  const setScrollPosition = () => {
    const pos = scrollData.get(scrollId);
    if (pos) {
      const elem = document.getElementById(scrollId);
      if (!elem) {
        setTimeout(setScrollPosition, 10);
      } else {
        elem.scrollTop = pos.y;
        elem.scrollLeft = pos.x;
      }
    }
  };
  useEffect(setScrollPosition);

  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <div style={{height, width}}
            id={scrollId}
            className={
              (className ? className + ' ' : '') + 'verticalScrollingDiv'
            }
            onScroll={getScrollPosition}
            {...props}
          >
            {children}
          </div>
        );
      }}
    </AutoSizer>
  );
}

export function VerticalScrollFixedVirtualList({
  scrollId,
  itemCount,
  itemSize,
  itemGenerator,
}: {
  scrollId: string,
  itemCount: number,
  itemSize: number,
  itemGenerator: (index: Number, style: Properties<>) => React$Node,
}) {
  let store = Store.useStore();
  const scrollData = store.get('scrollManager');
  const getScrollPosition = (ev) => {
    const pos = { x: ev.target.scrollLeft, y: ev.target.scrollTop };
    if (pos) {
      scrollData.set(scrollId, pos);
    }
  };
  const setScrollPosition = () => {
    const pos = scrollData.get(scrollId);
    if (pos) {
      const elem = document.getElementById(scrollId);
      if (!elem) {
        setTimeout(setScrollPosition, 10);
      } else {
        elem.scrollTop = pos.y;
        elem.scrollLeft = pos.x;
      }
    }
  };
  useEffect(setScrollPosition);
  return (
    <AutoSizer>
      {({ height, width }) => (
        <FixedSizeList
          id={scrollId}
          height={height}
          width={width}
          itemCount={itemCount}
          itemSize={itemSize}
        >
          {itemGenerator}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
}
