// @flow

import * as React from 'react';
import Store from '../MyStore';

import deletePic from '../img/delete.svg';
import addPic from '../img/add.svg';

import './Settings.css';

const removeFromSet = (set: Set<string>, val: string) => {
  const newSet = new Set(set);
  newSet.delete(val);
  return newSet;
};

const Settings = () => {
  const store = Store.useStore();
  const config: Set<string> = store.get('Configuration');
  const setConfig = store.set('Configuration');
  const elems = [];
  let num = 2;
  config.forEach(elem => {
    const theStyle = { gridRow: num };
    elems.push(
      <img
        style={theStyle}
        className="delete-pic"
        src={deletePic}
        key={'>' + elem}
        alt="Delete Item"
        onClick={() => setConfig(removeFromSet(config, elem))}
      />
    );
    elems.push(
      <span key={'<' + elem} style={theStyle} className="config-name">
        {elem}
      </span>
    );
    num++;
  });
  return (
    <div className="table-2-column">
      <span></span>
      <span className="table-header">Locations</span>
      {elems}
      <label className="add-label" htmlFor="folder-picker">
        <img
          className="add-pic"
          src={addPic}
          alt="add source"
          onClick={() => {
            const locations = window.remote.dialog.showOpenDialogSync({
              properties: ['openDirectory']
            });
            setConfig(new Set([...locations, ...config]));
          }}
        />
      </label>
    </div>
  );
};
export default Settings;
