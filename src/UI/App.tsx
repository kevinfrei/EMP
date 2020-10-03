import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { RecoilRoot } from 'recoil';
import Sidebar from './Sidebar';
import SongControls from './SongControls';
import SongDetailPanel from './SongDetailPanel';
import SongPlayback from './SongPlayback';
import './styles/App.css';
import Utilities from './Utilities';
import ViewSelector from './Views/Selector';
import VolumeControl from './VolumeControl';

export default function App(): JSX.Element {
  return (
    <RecoilRoot>
      <Utilities />
      <span className="grabber"></span>
      <span className="left-column"></span>
      <span className="top-row"></span>
      <React.Suspense fallback="Initializing...">
        <SongControls />
        <SongPlayback />
        <VolumeControl />
        <Sidebar />
      </React.Suspense>
      <React.Suspense fallback="Please wait...">
        <ViewSelector />
      </React.Suspense>
      <SongDetailPanel />
    </RecoilRoot>
  );
}
