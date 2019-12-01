// @flow
import React from 'react';
import Store from './MyStore';

import type { ViewNames } from './MyStore';

const Sidebar = () => {
  let store = Store.useStore();
  const plain = {};
  const selected = { fontWeight: 'bold' };
  const is = (nm: ViewNames) => (store.get('curView') === nm ? selected : plain);
  const cl = (nm: ViewNames) => () => store.set('curView')(nm);
  return (
    <div id="sidebar">
      <div className="search-bar">
        <input type="text"/>
      </div>
      <div style={is('album')} onClick={cl('album')}>
        Albums
      </div>
      <div style={is('artist')} onClick={cl('artist')}>
        Aritsts
      </div>
      <div style={is('song')} onClick={cl('song')}>
        Songs
      </div>
      <div style={is('playlist')} onClick={cl('playlist')}>
        Playlists
      </div>
      <div>Foo: {store.get('foo')}</div>
      <div>Bar: {store.get('bar')}</div>
    </div>
  );
};

export default Sidebar;
