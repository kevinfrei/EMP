import React, { useLayoutEffect, useRef } from 'react';
import { FixedSizeList, VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import Store from './MyStore';

import type { Properties } from 'csstype';
import type { ListOnScrollProps } from 'react-window';

import './styles/Scrollables.css';

export function VerticalScrollDiv({
  scrollId,
  layoutId,
  children,
  className,
  ...props
}: {
  scrollId: string;
  layoutId: string;
  children: React.ReactNode;
  className?: string;
  props?: Properties<HTMLDivElement>[];
}): JSX.Element {
  const store = Store.useStore();
  const scrollData = store.get('scrollManager');
  const getScrollPosition = (ev: React.UIEvent<HTMLElement>) => {
    const pos = {
      x: ev.currentTarget.scrollLeft,
      y: ev.currentTarget.scrollTop,
    };
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
    scroller!.addEventListener('scroll', getScrollPosition as any);
    return () => {
      window.removeEventListener('resize', listenForSize);
      scroller!.removeEventListener('scroll', getScrollPosition as any);
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

declare type generator = ({
  index,
  style,
}: {
  index: number;
  style: React.CSSProperties;
}) => JSX.Element;

export function VerticalScrollFixedVirtualList({
  scrollId,
  itemCount,
  itemSize,
  itemGenerator,
}: {
  scrollId: string;
  itemCount: number;
  itemSize: number;
  itemGenerator: generator;
}) {
  const ref: React.MutableRefObject<FixedSizeList | null> = useRef(null);
  const store = Store.useStore();
  const scrollData = store.get('scrollManager');
  let alreadySet = false;

  const getScrollPosition = (props: ListOnScrollProps) => {
    if (scrollData.get(scrollId) && !alreadySet) {
      return;
    }
    const pos = { x: 0, y: props.scrollOffset };
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

  const customView = ({ height, width }: { height: number; width: number }) => (
    <FixedSizeList
      ref={ref}
      height={height}
      width={width}
      itemCount={itemCount}
      itemSize={itemSize}
      onScroll={getScrollPosition}
    >
      {itemGenerator as any}
    </FixedSizeList>
  );
  return <AutoSizer>{customView}</AutoSizer>;
}

export function VerticalScrollVariableVirtualList({
  scrollId,
  itemCount,
  estimatedItemSize,
  itemSizeGenerator,
  itemGenerator,
}: {
  scrollId: string;
  itemCount: number;
  estimatedItemSize: number;
  itemSizeGenerator: (index: number) => number;
  itemGenerator: (index: number, style: React.CSSProperties) => React.ReactNode;
}) {
  const ref: React.MutableRefObject<VariableSizeList | null> = useRef(null);
  const store = Store.useStore();
  const scrollData = store.get('scrollManager');
  let alreadySet = false;
  const getScrollPosition = (props: ListOnScrollProps) => {
    if (scrollData.get(scrollId) && !alreadySet) {
      return;
    }
    const pos = { x: 0, y: props.scrollOffset };
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

  const customView = ({ height, width }: { height: number; width: number }) => (
    <VariableSizeList
      ref={ref}
      height={height}
      width={width}
      itemCount={itemCount}
      estimatedItemSize={estimatedItemSize}
      itemSize={itemSizeGenerator}
      onScroll={getScrollPosition}
    >
      {itemGenerator as any}
    </VariableSizeList>
  );
  return <AutoSizer>{customView}</AutoSizer>;
}
