// @flow

import * as React from 'react';
import Store from '../MyStore';

import deletePic from '../img/delete.svg';
import addPic from '../img/add.svg';

import './styles/Settings.css';

const removeFromSet = (set: Array<string>, val: string): Array<string> => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

const Settings = () => {
  const store = Store.useStore();
  const config: Array<string> = store.get('locations');
  const setConfig = store.set('locations');
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
            const locations: ?Array<string> = window.remote.dialog.showOpenDialogSync(
              {
                properties: ['openDirectory']
              }
            );
            if (locations) {
              setConfig([...locations, ...config]);
            }
          }}
        />
      </label>
    </div>
  );
};
export default Settings;
