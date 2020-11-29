import { SearchBox, Text } from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { SetterOrUpdater, useRecoilCallback, useRecoilState } from 'recoil';
import { searchTermState } from '../Recoil/ReadOnly';
import { CurrentView, curViewState } from '../Recoil/ReadWrite';
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
      <span className="sidebar-icon" id={(view.title || '').replace(/ /g, '-')}>
        &nbsp;
      </span>
      <Text variant="mediumPlus" className={`sidebar-text${extra}`}>
        {view.title}
      </Text>
    </div>
  );
}

// This is used to prevent responding to global keypresses when the input box
// is active
export function isSearchBox(target: EventTarget | null): boolean {
  if (
    target !== null &&
    Type.hasStr(target, 'type') &&
    Type.hasStr(target, 'tagName') &&
    Type.hasStr(target, 'placeholder')
  ) {
    return (
      target.type === 'text' &&
      target.tagName === 'INPUT' &&
      target.placeholder === 'Search'
    );
  }
  return false;
}

export default function Sidebar(): JSX.Element {
  const [curView, setCurView] = useRecoilState(curViewState);
  const onSearch = useRecoilCallback(({ set }) => (newValue: string) => {
    set(curViewState, CurrentView.search);
    set(searchTermState, newValue);
  });
  const onFocus = useRecoilCallback(({ set }) => () => {
    set(curViewState, CurrentView.search);
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
