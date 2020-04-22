// @flow

import React, { useEffect } from 'react';

import AlbumsView from './Albums';
import ArtistsView from './Artists';
import MixedSongsView from './MixedSongs';
import RecentlyAddedView from './RecentlyAdded';
import NowPlayingView from './NowPlaying';
import SettingsView from './Settings';
import PlaylistsView from './Playlists';
import Store from '../MyStore';

import './styles/Selector.css';

import type { ViewNames } from '../MyStore';

function scroll({ x, y }: { x: number, y: number }) {
  const target = document.getElementById('scrollview');
  if (!target) {
    setTimeout(() => scroll({ x, y }), 10);
  } else {
    target.scrollLeft = x;
    target.scrollTop = y;
  }
}

const ViewSelector = () => {
  //  const [which, setView] = React.useState('artist');
  let store = Store.useStore();
  const which: ViewNames = store.get('curView');
  const scrollData = store.get('scrollManager');
  let pos = scrollData.get(which);
  if (!pos) {
    pos = { x: 0, y: 0 };
    scrollData.set(which, pos);
  }

  useEffect(() => {
    const pos = scrollData.get(which);
    if (pos) {
      scroll(pos);
    }
  }, [which, scrollData]);

  const getScrollPosition = (ev) => {
    scrollData.set(which, { x: ev.target.scrollLeft, y: ev.target.scrollTop });
  };

  let res: React$Node;
  switch (which) {
    case 'album':
      res = <AlbumsView />;
      break;
    case 'artist':
      res = <ArtistsView />;
      break;
    case 'playlist':
      res = <PlaylistsView />;
      break;
    case 'song':
      res = <MixedSongsView />;
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
    case 'none':
    default:
      res = <></>;
  }
  return (
    <div id="scrollview" className="current-view" onScroll={getScrollPosition}>
      {res}
    </div>
  );
};

export default ViewSelector;
