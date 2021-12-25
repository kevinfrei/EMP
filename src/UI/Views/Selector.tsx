import { CSSProperties } from 'react';
import { useRecoilValue } from 'recoil';
import { CurrentView, curViewFunc } from '../../Recoil/ReadWrite';
import { GroupedAlbumList } from './Albums';
import { GroupedAristList } from './Artists';
import { MixedSongsList } from './MixedSongs';
import { NowPlayingView } from './NowPlaying';
import { NuAlbumView } from './NuAlbums';
import { PlaylistView } from './Playlists';
import { RecentlyAddedView } from './RecentlyAdded';
import { SearchResultsView } from './SearchResults';
import { SettingsView } from './Settings';
import './styles/Selector.css';

export default function ViewSelector(): JSX.Element {
  const which = useRecoilValue(curViewFunc);
  const sl = (v: CurrentView): CSSProperties =>
    which === v ? {} : { visibility: 'hidden' };
  return (
    <>
      <div className="current-view" style={sl(CurrentView.disabled)}>
        <NuAlbumView />
      </div>
      <div className="current-view" style={sl(CurrentView.album)}>
        <GroupedAlbumList />
      </div>
      <div className="current-view" style={sl(CurrentView.artist)}>
        <GroupedAristList />
      </div>
      <div className="current-view" style={sl(CurrentView.song)}>
        <MixedSongsList />
      </div>
      <div className="current-view" style={sl(CurrentView.playlist)}>
        <PlaylistView />
      </div>
      <div className="current-view" style={sl(CurrentView.current)}>
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
    </>
  );
}
