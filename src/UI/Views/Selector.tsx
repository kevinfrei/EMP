import React from 'react';

import { CurrentView, CurViewAtom } from '../../Recoil/Atoms';

import AlbumView from './Albums';
import ArtistView from './Artists';
import MixedSongView from './MixedSongs';
import PlaylistsView from './Playlists';
import NowPlayingView from './NowPlaying';
import SettingsView from './Settings';
import { useRecoilValue } from 'recoil';
import RecentlyAddedView from './RecentlyAdded';

export default function ViewSelector(): JSX.Element {
  const which = useRecoilValue<CurrentView>(CurViewAtom);
  switch (which) {
    case CurrentView.Album:
      return <AlbumView />;
    case CurrentView.Artist:
      return <ArtistView />;
    case CurrentView.Playlist:
      return <PlaylistsView />;
    case CurrentView.Recent:
      return <RecentlyAddedView />;
    case CurrentView.Current:
      return <NowPlayingView />;
    case CurrentView.Settings:
      return <SettingsView />;
    case CurrentView.Song:
      return <MixedSongView />;
    default:
      return <></>;
  }
}
