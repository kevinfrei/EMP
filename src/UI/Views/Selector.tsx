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

export type ViewProps = { hidden: boolean };

export default function ViewSelector(): JSX.Element {
  const which = useRecoilValue<CurrentView>(curViewAtom);
  return (
    <>
      <AlbumView hidden={which !== CurrentView.album} />
      <ArtistView hidden={which !== CurrentView.artist} />
      <MixedSongView hidden={which !== CurrentView.song} />
      <PlaylistsView hidden={which !== CurrentView.playlist} />
      <NowPlayingView hidden={which !== CurrentView.current} />
      <SettingsView hidden={which !== CurrentView.settings} />
      <RecentlyAddedView hidden={which !== CurrentView.recent} />
    </>
  );
}
