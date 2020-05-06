// @flow

import React, { useLayoutEffect, useRef } from 'react';

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
  let ref = useRef(null);
  let store = Store.useStore();
  const scrollData = store.get('scrollManager');
  let alreadySet = false;
  const getScrollPosition = (ev) => {
    if (scrollData.get(scrollId) && !alreadySet) {
      return;
    }
    const pos = { x: 0, y: ev.scrollOffset };
    scrollData.set(scrollId, pos);
  };
  const setScrollPosition = () => {
    const pos = scrollData.get(scrollId);
    if (!pos) {
      alreadySet = true;
      return;
    }
    if (!ref.current) {
      setTimeout(setScrollPosition, 1);
      return;
    }
    alreadySet = true;
    ref.current.scrollTo(pos.y);
  };
  useLayoutEffect(setScrollPosition);

  const customView = ({ height, width }) => (
    <FixedSizeList
      ref={ref}
      height={height}
      width={width}
      itemCount={itemCount}
      itemSize={itemSize}
      onScroll={getScrollPosition}
    >
      {itemGenerator}
    </FixedSizeList>
  );
  return <AutoSizer>{customView}</AutoSizer>;
}
