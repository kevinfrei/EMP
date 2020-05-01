// @flow

import * as React from 'react';
import Store from '../MyStore';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

import deletePic from '../img/delete.svg';
import addPic from '../img/add.svg';

import './styles/Settings.css';

const removeFromSet = (set: Array<string>, val: string): Array<string> => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

function GetDirs() {
  return window.remote.dialog.showOpenDialogSync({
    properties: ['openDirectory'],
  });
}
const Settings = () => {
  const store = Store.useStore();
  const config: Array<string> = store.get('locations');
  const setConfig = store.set('locations');
  const elems = config.map((elem) => (
    <tr key={'>' + elem}>
      <td>
        <img
          className="delete-pic pic-button"
          src={deletePic}
          alt="Delete Item"
          onClick={() => setConfig(removeFromSet(config, elem))}
        />
      </td>
      <td>{elem}</td>
    </tr>
  ));
  const plLoc = store.get('playlistLocation');
  const setLocation = store.set('playlistLocation');
  const playlistLocation =
    plLoc.length > 0 ? plLoc : 'Please set a Playlist save location.';
  const articles = store.get('SortWithArticles');
  const setArticles = store.set('SortWithArticles');
  return (
    <Table size="sm">
      <thead>
        <tr key="<locationsHeader">
          <td />
          <td>Music Locations</td>
        </tr>
      </thead>
      <tbody>
        {elems}
        <tr key="<locationsFooter">
          <td />
          <td>
            <img
              className="add-pic pic-button"
              src={addPic}
              alt="add source"
              onClick={() => {
                const locations: ?Array<string> = GetDirs();
                if (locations) {
                  setConfig([...locations, ...config]);
                }
              }}
            />
          </td>
        </tr>
      </tbody>
      <thead>
        <tr key="<pllocHeader">
          <td />
          <td>Playlist location</td>
        </tr>
      </thead>
      <tbody>
        <tr key="<plloc">
          <td>
            <Button
              size="sm"
              onClick={() => {
                const locs: ?Array<string> = GetDirs();
                if (locs) {
                  setLocation(locs[0]);
                }
              }}
            >
              Change
            </Button>
          </td>
          <td colSpan={2}>{playlistLocation}</td>
        </tr>
      </tbody>
      <thead>
        <tr key="<sortHeader">
          <td />
          <td>Sorting Preferences</td>
        </tr>
      </thead>
      <tbody>
        <tr key="<sorting">
          <td rowSpan={2}>
            <input
              type="checkbox"
              checked={articles}
              onChange={() => setArticles(!articles)}
            ></input>
          </td>
          <td>Consider 'the'/'a'/'an' when sorting</td>
        </tr>
      </tbody>
    </Table>
  );
};
export default Settings;
