// eslint-disable-next-line @typescript-eslint/no-use-before-define
import { SearchBox } from '@fluentui/react';
import React, { useState } from 'react';
import { SetterOrUpdater, useRecoilState } from 'recoil';
import { CurrentView, curViewAtom } from '../Recoil/Local';
import './styles/Sidebar.css';

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
  mkEntry(CurrentView.album, 'Albums', albumPic),
  mkEntry(CurrentView.artist, 'Artists', artistPic),
  mkEntry(CurrentView.song, 'All Songs', songPic),
  mkEntry(CurrentView.playlist, 'Playlists', playlistPic),
  mkEntry(CurrentView.current, 'Now Playing', nowPlayingPic),
  null,
  mkEntry(CurrentView.settings, 'Settings', settingsPic),
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
  const [curView, setCurView] = useRecoilState(curViewAtom);
  const [, setSearch] = useState('');
  return (
    <div id="sidebar">
      <SearchBox
        placeholder="Search NYI"
        onSearch={(newValue) => setSearch(newValue)}
      />
      <br />
      {views.map((ve, index) => getEntry(curView, setCurView, ve, index))}
      <div id="data" />
    </div>
  );
}
