// @flow

import { atom, selector, atomFamily } from 'recoil';
import logger from 'simplelogger';

import { SortAlbumsAtoms } from './Sorters';

import type { SongKey, Song, Artist, Album, MediaInfo } from './MyStore';

const log = logger.bind('Atoms');
logger.enable('Atoms');

// This is the 'locations' for searching
const locList = atom({ key: 'locations-atom', default: undefined });
export const locations = selector({
  key: 'locations-selector',
  get: async ({ get }): Promise<Array<string>> => {
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
  set: ({ set }, newValue: Array<string>) => {
    // Send the array to the main process
    set(locList, newValue);
    const result = window.ipcPromise.send('promise-set', {
      key: 'p-locations',
      value: newValue,
    });
  },
});

const mediaInfoCache: Map<string, MediaInfo> = new Map();
export function getMediaInfoSelector(id: SongKey) {
  return selector({
    key: `mediaInfoSelector${id}`,
    get: (param: SongKey) => {
      return async () => {
        if (mediaInfoCache.has(id)) {
          return mediaInfoCache.get(id);
        } else {
          const result = await window.ipcPromise.send('promise-mediaInfo', id);
          mediaInfoCache.set(result.key, result.data);
          return result.data;
        }
      };
    },
  });
}
