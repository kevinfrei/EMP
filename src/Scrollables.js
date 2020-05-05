// @flow

import React, { useEffect, useLayoutEffect } from 'react';

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
  const scrollData = store.get('scrollManager');
  const getScrollPosition = (ev) => {
    const pos = { x: ev.target.scrollLeft, y: ev.target.scrollTop };
    scrollData.set(scrollId, pos);
  };
  const setScrollPosition = () => {
    const pos = scrollData.get(scrollId);
    const scroller = document.getElementById(scrollId);
    if (pos) {
      if (!scroller) {
        setTimeout(setScrollPosition, 1);
      } else {
        scroller.scrollTop = pos.y;
        scroller.scrollLeft = pos.x;
      }
    }
  };
  const listenForSize = () => {
    const scroller = document.getElementById(scrollId);
    const theSpace = document.getElementById(layoutId);
    if (scroller && theSpace) {
      const rect = theSpace.getBoundingClientRect();
      scroller.style.height = `${rect.height}px`;
      scroller.style.width = `${rect.width}px`;
      scroller.style.left = `${rect.left}px`;
      scroller.style.top = `${rect.top}px`;
      setScrollPosition();
    }
  };
  const eventListenerEffects = () => {
    const scroller = document.getElementById(scrollId);
    listenForSize();
    window.addEventListener('resize', listenForSize);
    scroller.addEventListener('scroll', getScrollPosition);
    return () => {
      window.removeEventListener('resize', listenForSize);
      scroller.removeEventListener('scroll', getScrollPosition);
    };
  };
  useLayoutEffect(setScrollPosition);
  useLayoutEffect(eventListenerEffects);
  return (
    <div
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
  itemGenerator: (index: number, style: Properties<>) => React$Node,
}) {
  if (false) {
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
//    useEffect(setScrollPosition);
  }
  const customView = ({ height, width }) => (
    <FixedSizeList
      id={scrollId}
      height={height}
      width={width}
      itemCount={itemCount}
      itemSize={itemSize}
    >
      {itemGenerator}
    </FixedSizeList>
  );
  return <AutoSizer>{customView}</AutoSizer>;
}
