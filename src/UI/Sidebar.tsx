import { SearchBox, Text } from '@fluentui/react';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { SetterOrUpdater, useRecoilCallback, useRecoilState } from 'recoil';
import { searchTermAtom } from '../Recoil/ReadOnly';
import { CurrentView, curViewAtom } from '../Recoil/ReadWrite';
import './styles/Sidebar.css';

type ViewEntry = { name: CurrentView; title: string };
const mkEntry = (name: CurrentView, title: string) => ({
  name,
  title,
});

const views: (ViewEntry | null)[] = [
  // mkEntry('recent', 'Recently Added', ),
  mkEntry(CurrentView.current, 'Now Playing'),
  null,
  mkEntry(CurrentView.album, 'Albums'),
  mkEntry(CurrentView.artist, 'Artists'),
  mkEntry(CurrentView.song, 'All Songs'),
  mkEntry(CurrentView.playlist, 'Playlists'),
  null,
  mkEntry(CurrentView.settings, 'Settings'),
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
      <span className="sidebar-icon" id={view.title.replaceAll(' ', '-')}>
        &nbsp;
      </span>
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
