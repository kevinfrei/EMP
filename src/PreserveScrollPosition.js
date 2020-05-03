// @flow

import React, { useEffect, Ref } from 'react';

import Store from './MyStore';

export type ElementFinder = () => HTMLElement;
export type PositionSetter = (ref: React$Ref<*>, x: number, y: number) => void;
export type PositionGetter = (ref: React$Ref<*>) => ?{ x: number, y: number };

function log(a) {
  console.log('PSP' + a);
}

function scroll(
  ref: React$Ref<*>,
  setter: PositionSetter,
  x: number,
  y: number
) {
  if (!ref.current) {
    // Do I need this?
    log(9);
    setTimeout(() => scroll(ref, setter, x, y), 10);
  } else {
    log(10);
    setter(ref, x, y);
  }
}

export default function PreserveScrollPosition(
  WrappedComponent: React$Node,
  scrollId: string,
  setter: PositionSetter,
  getter: PositionGetter
) {
  let store = Store.useStore();
  const scrollData = store.get('scrollManager');
  let ref = React.createRef();
  const getScrollPosition = (ev) => {
    const pos = getter(ref);
    log(1);
    if (pos) {
      log(2);
      scrollData.set(scrollId, pos);
    }
  };

  useEffect(() => {
    // Before render, set the scroll positon
    const pos = scrollData.get(scrollId);
    log(3);
    if (pos) {
      log(4);
      scroll(ref, setter, pos.x, pos.y);
    }
    // Also find the target element and get it's onScroll method
    if (ref.current) {
      log(5);
      ref.current.addEventListener('scroll', getScrollPosition);
    }
    return () => {
      log(6);
      if (ref.current) {
        log(7);
        const pos = getter(ref);
        if (pos) {
          log(8);
          scrollData.set(scrollId, pos);
        }
        ref.current.removeEventListener('scroll', getScrollPosition);
      }
    };
  });

  return <WrappedComponent ref={ref} />;
}
