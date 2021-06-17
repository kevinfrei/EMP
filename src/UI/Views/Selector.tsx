import { CSSProperties } from 'react';
import { useRecoilValue } from 'recoil';
import { CurrentView, curViewState } from '../../Recoil/ReadWrite';
import AlbumView from './Albums';
import ArtistView from './Artists';
import MixedSongView from './MixedSongs';
import NowPlayingView from './NowPlaying';
import NuAlbumView from './NuAlbums';
import PlaylistsView from './Playlists';
import RecentlyAddedView from './RecentlyAdded';
import SearchResultsView from './SearchResults';
import SettingsView from './Settings';
import './styles/Selector.css';

export default function ViewSelector(): JSX.Element {
  const which = useRecoilValue(curViewState);
  const sl = (v: CurrentView): CSSProperties =>
    which === v ? {} : { visibility: 'hidden' };
  return (
    <>
      <div className="current-view" style={sl(CurrentView.disabled)}>
        <NuAlbumView />
      </div>
      <div className="current-view" style={sl(CurrentView.album)}>
        <AlbumView />
      </div>
      <div className="current-view" style={sl(CurrentView.artist)}>
        <ArtistView />
      </div>
      <div className="current-view" style={sl(CurrentView.song)}>
        <MixedSongView />
      </div>
      <div className="current-view" style={sl(CurrentView.playlist)}>
        <PlaylistsView />
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
