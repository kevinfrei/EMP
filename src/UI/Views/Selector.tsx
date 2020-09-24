import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { CurrentView, curViewAtom } from '../../Recoil/Local';
import AlbumView from './Albums';
import ArtistView from './Artists';
import MixedSongView from './MixedSongs';
import NowPlayingView from './NowPlaying';
import PlaylistsView from './Playlists';
import RecentlyAddedView from './RecentlyAdded';
import SettingsView from './Settings';

export default function ViewSelector(): JSX.Element {
  const which = useRecoilValue<CurrentView>(curViewAtom);
  switch (which) {
    case CurrentView.album:
      return <AlbumView />;
    case CurrentView.artist:
      return <ArtistView />;
    case CurrentView.playlist:
      return <PlaylistsView />;
    case CurrentView.recent:
      return <RecentlyAddedView />;
    case CurrentView.current:
      return <NowPlayingView />;
    case CurrentView.settings:
      return <SettingsView />;
    case CurrentView.song:
      return <MixedSongView />;
    default:
      return <></>;
  }
}
