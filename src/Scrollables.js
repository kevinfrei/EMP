// @flow

import React, { useEffect, useRef } from 'react';

import Store from './MyStore';

import './styles/Scrollables.css';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import type { Properties } from 'csstype';

export function VerticalScrollDiv({
  scrollId,
  layoutId,
  children,
  className,
  ...props
}: {
  scrollId: string,
  layoutId: string,
  children: React$Node,
  className?: string,
  props?: Array<Properties<HTMLDivElement>>,
}) {
  let store = Store.useStore();
  const theDiv = useRef(null);
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
  const listenForSize = () => {
    const theSpace = document.getElementById(layoutId);
    const scroller = document.getElementById(scrollId);
    if (scroller && theSpace) {
      const rect = theSpace.getBoundingClientRect();
      scroller.style.left = `${rect.left}px`;
      scroller.style.top = `${rect.top}px`;
      scroller.style.height = `${rect.height}px`;
      scroller.style.width = `${rect.width}px`;
    }
  };
  useEffect(() => {
    listenForSize();
    window.addEventListener('resize', listenForSize);
    theDiv.current.addEventListener('scroll', getScrollPosition);
    return () => {
      window.removeEventListener('resize', listenForSize);
      theDiv.current.removeEventListener('scroll', getScrollPosition);
    };
  });
  return (
    <div ref={theDiv}
      id={scrollId}
      className={(className ? className + ' ' : '') + 'verticalScrollingDiv'}
      {...props}
    >
      {children}
    </div>
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
