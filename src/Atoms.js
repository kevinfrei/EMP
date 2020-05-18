// @flow

import { atom, selector } from 'recoil';

import { SortAlbumsAtoms } from './Sorters';

import type { Song, Artist, Album, MediaInfo } from './MyStore';

function mka(key, def) {
  return atom({ key, default: def });
}

function mkrwsel(key, get, set) {
  return selector({ key, get, set });
}

function mkrsel(key, get) {
  return selector({ key, get });
}

function mkwsel(key, set) {
  return selector({ key, set });
}

// This is the 'locations' for searching
export const locations = mkrwsel(
  'locations',
  async ({ get }): Promise<Array<string>> => {
    console.log('About to await the IPC');
    const result = await window.ipcPromise.send('promiseTest', { a: 'myData' });
    // Retrieve the array from the main process
    // TODO:
    console.log(`Got the data ${typeof result}`);
    console.log(result);
    return result.toString();
  },
  ({ set }, newValue: Array<string>) => {
    // Send the array to the main process
  }
);


