import { SearchBox, Text } from '@fluentui/react';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { SetterOrUpdater, useRecoilCallback, useRecoilState } from 'recoil';
import { searchTermAtom } from '../Recoil/ReadOnly';
import { CurrentView, curViewAtom } from '../Recoil/ReadWrite';
import albumPic from './img/album.svg';
import artistPic from './img/artist.svg';
import nowPlayingPic from './img/playing.svg';
import playlistPic from './img/playlist.svg';
import settingsPic from './img/settings.svg';
import songPic from './img/song.svg';
// import recentPic from './img/recent.svg';
import './styles/Sidebar.css';

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
  const [curView, setCurView] = useRecoilState(curViewAtom);
  const onSearch = useRecoilCallback(({ set }) => (newValue: string) => {
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
