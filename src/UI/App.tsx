// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { RecoilRoot } from 'recoil';

import Sidebar from './Sidebar';
import ViewSelector from './Views/Selector';
import Utilities from './Utilities';
import SongControls from './SongControls';
import SongPlayback from './SongPlayback';
import VolumeControl from './VolumeControl';

import './styles/App.css';
import { PersistenceObserver } from '../Recoil/helpers';

export default function App(): JSX.Element {
  return (
    <RecoilRoot>
      <React.Suspense fallback="">
        <PersistenceObserver />
        <Utilities />
      </React.Suspense>
      <span className="grabber"></span>
      <span className="left-column"></span>
      <span className="top-row"></span>
      <React.Suspense fallback="Initializing...">
        <SongControls />
        <SongPlayback />
        <VolumeControl />
      </React.Suspense>
      <Sidebar />
      <React.Suspense fallback="Please wait...">
        <ViewSelector />
      </React.Suspense>
    </RecoilRoot>
  );
}
