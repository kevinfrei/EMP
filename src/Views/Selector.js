// @flow

import React, { useEffect } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import AlbumViewCreator from './Albums';
import ArtistViewCreator from './Artists';
import MixedSongsView from './MixedSongs';
import RecentlyAddedView from './RecentlyAdded';
import NowPlayingView from './NowPlaying';
import SettingsView from './Settings';
import PlaylistsView from './Playlists';
import Store from '../MyStore';

import './styles/Selector.css';

import type { ViewNames, StoreState } from '../MyStore';

/*
function scroll({ x, y }: { x: number, y: number }) {
  const target = document.getElementById('scrollview');
  if (!target) {
    setTimeout(() => scroll({ x, y }), 10);
  } else {
    target.scrollLeft = x;
    target.scrollTop = y;
  }
}
*/

const ViewSelector = () => {
  //  const [which, setView] = React.useState('artist');
  let store = Store.useStore();
  const which: ViewNames = store.get('curView');
  /*  const scrollData = store.get('scrollManager');
  let pos = scrollData.get(which);
  if (!pos) {
    pos = { x: 0, y: 0 };
    scrollData.set(which, pos);
  }
*/
  let viewCreator: ?Function = null;
  switch (which) {
    case 'album':
      viewCreator = AlbumViewCreator;
      break;
    case 'artist':
      viewCreator = ArtistViewCreator;
      break;
    case 'playlist':
      //      res = <PlaylistsView />;
      break;
    case 'song':
      //      res = <MixedSongsView />;
      break;
    case 'recent':
      //      res = <RecentlyAddedView />;
      break;
    case 'current':
      //      res = <NowPlayingView />;
      break;
    case 'settings':
      return (
        <div id="scrollview" className="current-view">
          <SettingsView />
        </div>
      );
    case 'none':
    default:
      return <></>;
  }
  /*
  useEffect(() => {
    const pos = scrollData.get(which);
    if (pos) {
      scroll(pos);
    }
  }, [which, scrollData]);

  const getScrollPosition = (ev) => {
    scrollData.set(which, { x: ev.target.scrollLeft, y: ev.target.scrollTop });
  };
*/
  return viewCreator ? (
    <div id="scrollview" className="current-view">
      <AutoSizer>
        {({ height, width }) => viewCreator(store, width, height)}
      </AutoSizer>
    </div>
  ) : (
    <div/>
  );
};

export default ViewSelector;
/*
  <div id="scrollview" className="current-view" onScroll={getScrollPosition}>
    {res}
  </div>
*/
