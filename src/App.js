// @flow
// @format

import React from 'react';

import Sidebar from './Sidebar';
import ViewSelector from './ViewSelector';
import Store from './MyStore';
import AsyncDoodad from './AsyncDoodad';

import './App.css';

const App = () => {
  return (
    <Store.Container>
      <Sidebar />
      <ViewSelector />
      <AsyncDoodad />
    </Store.Container>
  );
};
export default App;