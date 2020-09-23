// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useLayoutEffect, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  FixedSizeList,
  ListOnScrollProps,
  VariableSizeList,
} from 'react-window';
import './styles/Scrollables.css';

declare type Generator = ({
  index,
  style,
}: {
  index: number;
  style: React.CSSProperties;
}) => JSX.Element;

type Point = { x: number; y: number };

export function VerticalScrollFixedVirtualList({
  scrollId,
  itemCount,
  itemSize,
  itemGenerator,
}: {
  scrollId: string;
  itemCount: number;
  itemSize: number;
  itemGenerator: Generator;
}): JSX.Element {
  const ref: React.MutableRefObject<FixedSizeList | null> = useRef(null);
  // const store = Store.useStore();
  const [scrollData] = useState(new Map<string, Point>());
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
}): JSX.Element {
  const ref: React.MutableRefObject<VariableSizeList | null> = useRef(null);
  // const store = Store.useStore();
  const [scrollData] = useState(new Map<string, Point>());
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
