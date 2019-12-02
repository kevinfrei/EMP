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
        <img className="add-pic" src={addPic} />
      </label>
      <input
        id="folder-picker"
        type="file"
        webkitdirectory=""
        style={{ display: 'none' }}
        onChange={ev => {
          setConfig(new Set([...config, ev.target.files[0].path.toString()]));
        }}
      />
    </div>
  );
};
export default Settings;
