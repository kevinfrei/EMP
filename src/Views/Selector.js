// @flow

import React, { useEffect } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import VirtualAlbumView from './Albums';
import VirtualArtistView from './Artists';
import VirtualSongView from './MixedSongs';
import MixedSongsView from './MixedSongs';
import RecentlyAddedView from './RecentlyAdded';
import NowPlayingView from './NowPlaying';
import SettingsView from './Settings';
import PlaylistsView from './Playlists';
import Store from '../MyStore';

import './styles/Selector.css';

import type { ViewNames, MapNames, StoreState } from '../MyStore';

type RowCreatorParams = { index: number, style: Object };
export type VirtualRowCreator = (param: RowCreatorParams) => React$Node;
export type VirtualViewInfo = {
  name: MapNames,
  height: number,
  rowCreator: VirtualRowCreator,
};

function scroll({ x, y }: { x: number, y: number }) {
  const target = document.getElementById('scrollview');
  if (!target) {
    setTimeout(() => scroll({ x, y }), 10);
  } else {
    target.scrollLeft = x;
    target.scrollTop = y;
  }
}

const virtualViews: Map<string, VirtualViewInfo> = new Map([
  ['album', VirtualAlbumView],
  ['artist', VirtualArtistView],
  ['song', VirtualSongView],
]);

function MakeVirtualView(store: StoreState, virtView: VirtualViewInfo) {
  const customView = ({ height, width }) => {
    const theMap = store.get(virtView.name);
    return (
      <FixedSizeList
        height={height}
        width={width}
        itemCount={theMap.size}
        itemSize={virtView.height}
      >
        {virtView.rowCreator}
      </FixedSizeList>
    );
  };
  return (
    <div id="scrollview" className="current-view">
      <AutoSizer>{customView}</AutoSizer>
    </div>
  );
}

export default function ViewSelector() {
  let store = Store.useStore();
  const which: ViewNames = store.get('curView');
  const scrollData = store.get('scrollManager');
  useEffect(() => {
    const pos = scrollData.get(which);
    if (pos) {
      scroll(pos);
    }
  }, [which, scrollData]);

  let pos = scrollData.get(which);
  if (!pos) {
    pos = { x: 0, y: 0 };
    scrollData.set(which, pos);
  }

  const virtView = virtualViews.get(which);
  if (virtView) {
    return MakeVirtualView(store, virtView);
  }

  let res;
  switch (which) {
    case 'playlist':
      res = <PlaylistsView />;
      break;
    case 'recent':
      res = <RecentlyAddedView />;
      break;
    case 'current':
      res = <NowPlayingView />;
      break;
    case 'settings':
      res = <SettingsView />;
      break;
    default:
      return <></>;
  }

  const getScrollPosition = (ev) => {
    scrollData.set(which, { x: ev.target.scrollLeft, y: ev.target.scrollTop });
  };

  return (
    <div id="scrollview" className="current-view" onScroll={getScrollPosition}>
      {res}
    </div>
  );
}
