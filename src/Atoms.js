// @flow

import { atom, selector, atomFamily, selectorFamily } from 'recoil';
import logger from 'simplelogger';

import type { SongKey, Song, Artist, Album, MediaInfo } from './MyStore';

const log = logger.bind('Atoms');
logger.enable('Atoms');

// This is the 'locations' for searching
export const locations = selector({
  key: 'locations-selector',
  get: async ({ get }): Promise<Array<string>> => {
    const result = await window.ipcPromise.send('promise-get', {
      key: 'locations',
    });
    log(`Got the data ${typeof result}`);
    log(result);
    return result || [];
  },
  set: ({ set }, newValue: Array<string>) => {
    // Send the array to the main process
    const result = window.ipcPromise.send('promise-set', {
      key: 'locations',
      value: newValue,
    });
  },
});

export const getMediaInfo = selectorFamily({
  key: 'mediaInfoSelector',
  get: (id) => async (param: SongKey) => {
    const result = await window.ipcPromise.send('promise-mediaInfo', id);
    return result.data;
  },
});
