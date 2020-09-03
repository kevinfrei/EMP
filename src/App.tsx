// @flow
// @format

import React from 'react';
import { RecoilRoot } from 'recoil';

import Sidebar from './Sidebar';
import ViewSelector from './Views/Selector';
import Store from './MyStore';
import AsyncDoodad from './AsyncDoodad';
import SongControls from './SongControls';
import SongPlayback from './SongPlayback';
import VolumeControl from './VolumeControl';

import './styles/App.css';

const App = () => {
  return (
    <Store.Container>
      <RecoilRoot>
        <AsyncDoodad />
        <span className="grabber"></span>
        <span className="left-column"></span>
        <span className="top-row"></span>
        <SongControls />
        <SongPlayback />
        <VolumeControl />
        <Sidebar />
        <ViewSelector />
      </RecoilRoot>
    </Store.Container>
  );
};
export default App;
