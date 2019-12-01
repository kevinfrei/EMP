// @flow
// @format

import React from 'react';

import Sidebar from './Sidebar';
import ViewSelector from './ViewSelector';
import Store from './MyStore';
import AsyncDoodad from './AsyncDoodad';
import SongControls from './SongControls';
import SongPlayback from './SongPlayback';
import VolumeControl from './VolumeControl';

import './App.css';

const App = () => {
  return (
    <Store.Container>
      <span className="grabber"></span>
      <span className="left-column"></span>
      <span className="top-row"></span>
      <SongControls />
      <SongPlayback />
      <VolumeControl />
      <Sidebar />
      <ViewSelector />
      <AsyncDoodad />
    </Store.Container>
  );
};
export default App;
