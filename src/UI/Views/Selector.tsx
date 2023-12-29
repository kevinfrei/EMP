import { CurrentView } from '@freik/emp-shared';
import { useAtomValue } from 'jotai';
import { CSSProperties, useState } from 'react';
import { curViewFunc } from '../../Jotai/CurrentView';
import { GroupedAlbumList } from './Albums';
import { GroupedAristList } from './Artists';
import { MixedSongsList } from './MixedSongs';
import { NowPlayingView } from './NowPlaying';
import { PlaybackOrder } from './PlaybackOrder';
import { PlaylistView } from './Playlists';
import { SearchResultsView } from './SearchResults';
import { SettingsView } from './Settings';
import { ToolsView } from './Tools';
import './styles/Selector.css';

function ignore(view: CurrentView): boolean {
  return view === CurrentView.settings || view === CurrentView.tools;
}

export function ViewSelector(): JSX.Element {
  const which = useAtomValue(curViewFunc);
  const [rendered, setRendered] = useState(new Set<CurrentView>([which]));
  // Let's see if I can speed this up a bit by not trying to render everything
  // the first time
  const sl = (v: CurrentView): CSSProperties =>
    which === v ? {} : { visibility: 'hidden' };
  const contents: [CurrentView, JSX.Element][] = [];
  if (!rendered.has(which) && !ignore(which)) {
    const newrendered = new Set<CurrentView>([which, ...rendered]);
    setRendered(newrendered);
    // We still need to do a full render, because otherwise elements get
    // deleted and recreated, and that's probably bad, right?
  }
  if (rendered.has(CurrentView.albums) || which === CurrentView.albums) {
    contents.push([CurrentView.albums, <GroupedAlbumList />]);
  }
  if (rendered.has(CurrentView.artists) || which === CurrentView.artists) {
    contents.push([CurrentView.artists, <GroupedAristList />]);
  }
  if (rendered.has(CurrentView.songs) || which === CurrentView.songs) {
    contents.push([CurrentView.songs, <MixedSongsList />]);
  }
  if (rendered.has(CurrentView.playlists) || which === CurrentView.playlists) {
    contents.push([CurrentView.playlists, <PlaylistView />]);
  }
  if (
    rendered.has(CurrentView.now_playing) ||
    which === CurrentView.now_playing
  ) {
    contents.push([CurrentView.now_playing, <NowPlayingView />]);
  }
  // if (false) {
  //   // (rendered.has(CurrentView.albums) || which === CurrentView.recent)
  //   contents.push([CurrentView.recent, <RecentlyAddedView />]);
  // }
  // if (false) {
  //   // (rendered.has(CurrentView.albums) || which === CurrentView.recent)
  //   contents.push([CurrentView.disabled, <NuAlbumView />]);
  // }
  if (which === CurrentView.settings) {
    contents.push([CurrentView.settings, <SettingsView />]);
  }
  if (rendered.has(CurrentView.search) || which === CurrentView.search) {
    contents.push([CurrentView.search, <SearchResultsView />]);
  }
  if (which === CurrentView.tools) {
    contents.push([CurrentView.tools, <ToolsView />]);
  }
  return (
    <>
      <PlaybackOrder />
      {contents.map(([view, elem]) => (
        <div key={view} className="current-view" style={sl(view)}>
          {elem}
        </div>
      ))}
    </>
  );
}
