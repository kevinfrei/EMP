import { CSSProperties } from 'react';
import { useRecoilValue } from 'recoil';
import { CurrentView } from 'shared';
import { curViewFunc } from '../../Recoil/ReadWrite';
import { GroupedAlbumList } from './Albums';
import { GroupedAristList } from './Artists';
import { MixedSongsList } from './MixedSongs';
import { NowPlayingView } from './NowPlaying';
import { NuAlbumView } from './NuAlbums';
import { PlaybackOrder } from './PlaybackOrder';
import { PlaylistView } from './Playlists';
import { RecentlyAddedView } from './RecentlyAdded';
import { SearchResultsView } from './SearchResults';
import { SettingsView } from './Settings';
import './styles/Selector.css';
import { ToolsView } from './Tools';

export function ViewSelector(): JSX.Element {
  const which = useRecoilValue(curViewFunc);
  const sl = (v: CurrentView): CSSProperties =>
    which === v ? {} : { visibility: 'hidden' };
  const panes: [CurrentView, JSX.Element][] = [
    [CurrentView.disabled, <NuAlbumView />],
    [CurrentView.albums, <GroupedAlbumList />],
    [CurrentView.artists, <GroupedAristList />],
    [CurrentView.songs, <MixedSongsList />],
    [CurrentView.playlists, <PlaylistView />],
    [CurrentView.now_playing, <NowPlayingView />],
    [CurrentView.recent, <RecentlyAddedView />],
    [CurrentView.settings, <SettingsView />],
    [CurrentView.search, <SearchResultsView />],
    [CurrentView.tools, <ToolsView />],
  ];
  return (
    <>
      <PlaybackOrder />
      {panes.map(([cv, elem]) => (
        <div key={cv} className="current-view" style={sl(cv)}>
          {elem}
        </div>
      ))}
    </>
  );
}
