import { SearchBox, Text } from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { SetterOrUpdater, useRecoilCallback } from 'recoil';
import { useBackedState } from '../Recoil/helpers';
import { searchTermAtom } from '../Recoil/ReadOnly';
import { CurrentView, curViewAtom } from '../Recoil/ReadWrite';
import './styles/Sidebar.css';

const log = MakeLogger('Sidebar', true);

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
  mkEntry(CurrentView.current, 'Now Playing', nowPlayingPic),
  null,
  mkEntry(CurrentView.album, 'Albums', albumPic),
  mkEntry(CurrentView.artist, 'Artists', artistPic),
  mkEntry(CurrentView.song, 'All Songs', songPic),
  mkEntry(CurrentView.playlist, 'Playlists', playlistPic),
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
      <Text variant="mediumPlus" className={`sidebar-text${extra}`}>
        {view.title}
      </Text>
    </div>
  );
}

export default function Sidebar(): JSX.Element {
  const [curView, setCurView] = useBackedState(curViewAtom);
  const onSearch = useRecoilCallback(({ set }) => (newValue: string) => {
    log('onSearch');
    set(curViewAtom, CurrentView.search);
    set(searchTermAtom, newValue);
  });
  const onFocus = useRecoilCallback(({ set }) => () => {
    set(curViewAtom, CurrentView.search);
  });
  return (
    <div id="sidebar">
      <SearchBox
        placeholder="Search"
        onSearch={onSearch}
        onFocus={onFocus}
        onChange={(e, nv) => nv && onSearch(nv)}
      />
      <br />
      {views.map((ve, index) => getEntry(curView, setCurView, ve, index))}
    </div>
  );
}
