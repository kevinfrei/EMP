import React from 'react';
import { useRecoilState } from 'recoil';

import Store from './MyStore';
import { CurrentView, CurViewAtom } from './Atoms';

import './styles/Sidebar.css';
import { SetterOrUpdater } from 'recoil';

/* eslint-disable @typescript-eslint/no-var-requires */
// import recentPic from './img/recent.svg';
const albumPic = require('./img/album.svg') as string;
const artistPic = require('./img/artist.svg') as string;
const songPic = require('./img/song.svg') as string;
const playlistPic = require('./img/playlist.svg') as string;
const nowPlayingPic = require('./img/playing.svg') as string;
const settingsPic = require('./img/settings.svg') as string;
/* eslint-enable */

type ViewEntry = { name: CurrentView; pic: string; title: string };
const mkEntry = (name: CurrentView, title: string, pic: string) => ({
  name,
  pic,
  title,
});

const views: (ViewEntry | null)[] = [
  // mkEntry('recent', 'Recently Added', recentPic),
  mkEntry(CurrentView.Album, 'Albums', albumPic),
  mkEntry(CurrentView.Artist, 'Artists', artistPic),
  mkEntry(CurrentView.Song, 'All Songs', songPic),
  mkEntry(CurrentView.Playlist, 'Playlists', playlistPic),
  mkEntry(CurrentView.Current, 'Now Playing', nowPlayingPic),
  null,
  mkEntry(CurrentView.Settings, 'Settings', settingsPic),
];

function getEntry(
  curView: CurrentView,
  setCurView: SetterOrUpdater<CurrentView>,
  view: ViewEntry | null,
  index: number,
) {
  if (!view) {
    return <hr key={index} />;
  }
  const extra = curView === view.name ? ' sidebar-selected' : '';
  return (
    <div
      key={index}
      className={`sidebar-container${extra}`}
      onClick={() => setCurView(view.name)}
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
  const [curView, setCurView] = useRecoilState(CurViewAtom);
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
      {views.map((ve, index) => getEntry(curView, setCurView, ve, index))}
      <div id="data" />
    </div>
  );
}
