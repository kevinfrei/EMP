// @flow
// @format

import React from 'react';

import Sidebar from './Sidebar';
import ViewSelector from './ViewSelector';
import Store from './MyStore';

import './App.css';
import AsyncDoodad from './AsyncDoodad';

const App = () => {
  return (
    <Store.Container>
      <AsyncDoodad />
      <ViewSelector />
      <Sidebar />
    </Store.Container>
  );
};
export default App;