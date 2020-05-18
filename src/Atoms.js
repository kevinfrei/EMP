// @flow

import { atom, selector } from 'recoil';
import logger from 'simplelogger';

import { SortAlbumsAtoms } from './Sorters';

import type { Song, Artist, Album, MediaInfo } from './MyStore';

const log = logger.bind('Atoms');
logger.enable('Atoms');

function mka(key, def) {
  return atom({ key, default: def });
}

function mkrwsel(key, get, set) {
  return selector({ key, get, set });
}
/*
function mkrsel(key, get) {
  return selector({ key, get });
}

function mkwsel(key, set) {
  return selector({ key, set });
}
*/

// This is the 'locations' for searching
const locList = mka('locations-atom', undefined);
export const locations = mkrwsel(
  'locations-selector',
  async ({ get }): Promise<Array<string>> => {
    const atomLocList = get(locList);
    if (atomLocList) {
      return atomLocList;
    }
    const result = await window.ipcPromise.send('promise-get', {
      key: 'p-locations',
    });
    log(`Got the data ${typeof result}`);
    log(result);
    return result || [];
  },
  ({ set }, newValue: Array<string>) => {
    // Send the array to the main process
    set(locList, newValue);
    const result = window.ipcPromise.send('promise-set', {
      key: 'p-locations',
      value: newValue,
    });
  }
);
