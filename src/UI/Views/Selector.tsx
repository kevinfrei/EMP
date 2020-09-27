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
  switch (which) {
    case CurrentView.album:
    case CurrentView.artist:
    case CurrentView.song:
    case CurrentView.playlist:
    case CurrentView.current:
    case CurrentView.settings:
      return (
        <>
          <AlbumView hidden={which !== CurrentView.album} />
          <ArtistView hidden={which !== CurrentView.artist} />
          <MixedSongView hidden={which !== CurrentView.song} />
          <PlaylistsView hidden={which !== CurrentView.playlist} />
          <NowPlayingView hidden={which !== CurrentView.current} />
          <SettingsView hidden={which !== CurrentView.settings} />
        </>
      );
    case CurrentView.recent:
      return <RecentlyAddedView />;
    default:
      return <></>;
  }
}
