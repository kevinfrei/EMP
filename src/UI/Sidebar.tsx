import { SearchBox, Text } from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { SetterOrUpdater, useRecoilCallback, useRecoilState } from 'recoil';
import { Keys, st, StrId } from 'shared';
import { SetSearch } from '../MyWindow';
import { searchTermState } from '../Recoil/ReadOnly';
import { CurrentView, curViewFunc } from '../Recoil/ReadWrite';
import { Notifier } from './Notifier';
import './styles/Sidebar.css';
import { GetHelperText } from './Utilities';

type ViewEntry = { name: CurrentView; title: StrId; accelerator: Keys };
const mkEntry = (name: CurrentView, title: StrId, accelerator: Keys) => ({
  name,
  title,
  accelerator,
});

const views: (ViewEntry | null)[] = [
  // mkEntry('recent', 'Recently Added', ),
  mkEntry(CurrentView.current, StrId.ViewNowPlaying, Keys.NowPlaying),
  null,
  mkEntry(CurrentView.album, StrId.ViewAlbums, Keys.Albums),
  mkEntry(CurrentView.artist, StrId.ViewArtists, Keys.Artists),
  mkEntry(CurrentView.song, StrId.ViewSongs, Keys.Songs),
  mkEntry(CurrentView.playlist, StrId.ViewPlaylists, Keys.Playlists),
  null,
  mkEntry(CurrentView.settings, StrId.ViewSettings, Keys.Settings),
  mkEntry(CurrentView.tools, StrId.ViewTools, Keys.Tools),
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
      title={GetHelperText(view.accelerator)}
    >
      <span className="sidebar-icon" id={st(view.title).replace(/ /g, '-')}>
        &nbsp;
      </span>
      <Text variant="mediumPlus" className={`sidebar-text${extra}`}>
        {st(view.title)}
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

export function Sidebar(): JSX.Element {
  const [curView, setCurView] = useRecoilState(curViewFunc);
  const onSearch = useRecoilCallback(({ set }) => (newValue: string) => {
    set(curViewFunc, CurrentView.search);
    set(searchTermState, newValue);
  });
  const onFocus = useRecoilCallback(({ set }) => () => {
    set(curViewFunc, CurrentView.search);
  });
  return (
    <div id="sidebar">
      <SearchBox
        placeholder="Search"
        onSearch={onSearch}
        onFocus={onFocus}
        onChange={(e, nv) => nv && onSearch(nv)}
        componentRef={(ref) => SetSearch(ref)}
        title={GetHelperText(Keys.Find)}
      />
      <br />
      {views.map((ve, index) => getEntry(curView, setCurView, ve, index))}
      <br />
      <Notifier />
    </div>
  );
}
