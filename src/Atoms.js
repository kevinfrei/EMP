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

export const SortWithArticles = selector({
  key: 'sort-with-articles-selector',
  get: async ({ get }): Promise<boolean> => {
    const result = await window.ipcPromise.send('promise-get', {
      key: 'sort-with-articles',
    });
    return !!result;
  },
  set: ({ set }, newValue: boolean) => {
    const result = window.ipcPromise.send('promise-set', {
      key: 'sort-with-articles',
      value: newValue,
    });
  },
});

// These aren't correct, but they're placeholders
export const AlbumListSort = selector({
  key: 'album-list-sort-selector',
  get: async ({ get }): Promise<string> => {
    const result = await window.ipcPromise.send('promise-set', {
      key: 'album-list-sort',
    });
    return result || 'AlbumTitle';
  },
  set: ({ set }, newValue: string) => {
    window.ipcPromise.send('promise-set', {
      key: 'album-list-sort',
      value: newValue,
    });
  },
});
export const ArtistListSort = selector({
  key: 'artist-list-sort-selector',
  get: async ({ get }): Promise<string> => {
    const result = await window.ipcPromise.send('promise-set', {
      key: 'artist-list-sort',
    });
    return result || 'ArtistName';
  },
  set: ({ set }, newValue: string) => {
    window.ipcPromise.send('promise-set', {
      key: 'artist-list-sort',
      value: newValue,
    });
  },
});
export const SongListSort = selector({
  key: 'song-list-sort-selector',
  get: async ({ get }): Promise<string> => {
    const result = await window.ipcPromise.send('promise-set', {
      key: 'song-list-sort',
    });
    return result || 'SongTitle';
  },
  set: ({ set }, newValue: string) => {
    window.ipcPromise.send('promise-set', {
      key: 'song-list-sort',
      value: newValue,
    });
  },
});
