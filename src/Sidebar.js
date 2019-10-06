// @flow
import React from 'react';
import Store from './MyStore';

const Sidebar = () => {
  let store = Store.useStore();
  return (
    <>
      <div>Albums</div>
      <div>Aritsts</div>
      <div>Playlists</div>
      <div>Songs</div>
      <div>Foo: {store.get('foo')}</div>
      <div>Bar: {store.get('bar')}</div>
    </>
  );
};
export default Sidebar;
