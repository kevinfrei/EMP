// @flow
import React from 'react';
import Store from './MyStore';

//import recentPic from './img/recent.svg';
import albumPic from './img/album.svg';
import artistPic from './img/artist.svg';
import songPic from './img/song.svg';
import playlistPic from './img/playlist.svg';
import nowPlayingPic from './img/playing.svg';
import settingsPic from './img/settings.svg';

import './styles/Sidebar.css';

import type { ViewNames, StoreState } from './MyStore';

type ViewEntry = { name: ViewNames, pic: mixed, title: string };
const mkEntry = (name: ViewNames, title: string, pic: mixed) => ({
  name,
  pic,
  title,
});

const views: Array<?ViewEntry> = [
  // mkEntry('recent', 'Recently Added', recentPic),
  mkEntry('album', 'Albums', albumPic),
  mkEntry('artist', 'Artists', artistPic),
  mkEntry('song', 'All Songs', songPic),
  mkEntry('playlist', 'Playlists', playlistPic),
  mkEntry('current', 'Now Playing', nowPlayingPic),
  null,
  mkEntry('settings', 'Settings', settingsPic),
];

function getEntry(store: StoreState, view: ?ViewEntry, index: number) {
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

export default function Sidebar() {
  let store = Store.useStore();
  let value = store.get('searchText');
  let setvalue = store.set('searchText');
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
