import React from 'react';
import Store from './MyStore';


import './styles/Sidebar.css';

import type { ViewNames, StoreState } from './MyStore';


/* eslint-disable @typescript-eslint/no-var-requires */
// import recentPic from './img/recent.svg';
const albumPic = require('./img/album.svg') as string;
const artistPic = require('./img/artist.svg') as string;
const songPic = require('./img/song.svg') as string;
const playlistPic = require('./img/playlist.svg') as string;
const nowPlayingPic = require('./img/playing.svg') as string;
const settingsPic = require('./img/settings.svg') as string;
/* eslint-enable */

type ViewEntry = { name: ViewNames; pic: string; title: string };
const mkEntry = (name: ViewNames, title: string, pic: string) => ({
  name,
  pic,
  title,
});

const views: (ViewEntry | null)[] = [
  // mkEntry('recent', 'Recently Added', recentPic),
  mkEntry('album', 'Albums', albumPic),
  mkEntry('artist', 'Artists', artistPic),
  mkEntry('song', 'All Songs', songPic),
  mkEntry('playlist', 'Playlists', playlistPic),
  mkEntry('current', 'Now Playing', nowPlayingPic),
  null,
  mkEntry('settings', 'Settings', settingsPic),
];

function getEntry(store: StoreState, view: ViewEntry | null, index: number) {
  if (!view) {
    return <hr key={index} />;
  }
  const extra = store.get('curView') === view.name ? ' sidebar-selected' : '';
  return (
    <div
      key={index}
      className={`sidebar-container${extra}`}
      onClick={() => store.set('curView')(view.name)}
    >
      <img src={view.pic} className="sidebar-icon" alt={view.title}></img>
      <span className="sidebar-text">{view.title}</span>
    </div>
  );
}

export default function Sidebar(): JSX.Element {
  const store = Store.useStore();
  const value = store.get('searchText');
  const setvalue = store.set('searchText');
  return (
    <div id="sidebar">
      <div className="search-bar">
        <input
          id="search"
          className="search-box"
          type="search"
          value={value}
          onChange={(ev) => setvalue(ev.target.value)}
        />
      </div>
      <br />
      {views.map((ve, index) => getEntry(store, ve, index))}
      <div id="data" />
    </div>
  );
}
