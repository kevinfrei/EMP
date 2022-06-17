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
  return (
    <>
      <PlaybackOrder />
      <div className="current-view" style={sl(CurrentView.disabled)}>
        <NuAlbumView />
      </div>
      <div className="current-view" style={sl(CurrentView.albums)}>
        <GroupedAlbumList />
      </div>
      <div className="current-view" style={sl(CurrentView.artists)}>
        <GroupedAristList />
      </div>
      <div className="current-view" style={sl(CurrentView.songs)}>
        <MixedSongsList />
      </div>
      <div className="current-view" style={sl(CurrentView.playlists)}>
        <PlaylistView />
      </div>
      <div className="current-view" style={sl(CurrentView.now_playing)}>
        <NowPlayingView />
      </div>
      <div className="current-view" style={sl(CurrentView.recent)}>
        <RecentlyAddedView />
      </div>
      <div className="current-view" style={sl(CurrentView.settings)}>
        <SettingsView />
      </div>
      <div className="current-view" style={sl(CurrentView.search)}>
        <SearchResultsView />
      </div>
      <div className="current-view" style={sl(CurrentView.tools)}>
        <ToolsView />
      </div>
    </>
  );
}
