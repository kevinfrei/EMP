// @flow

import {
  atom,
  selector,
  atomFamily,
  selectorFamily,
  useRecoilState,
} from 'recoil';
import logger from 'simplelogger';
import { useRef, useEffect } from 'react';

import type { SongKey, Song, Artist, Album, MediaInfo } from './MyStore';
import type { RecoilState } from 'recoil';

const log = logger.bind('Atoms');
logger.enable('Atoms');

// This should return a server-sync'ed atom
function mkBackAtom<T>(key: string, def: T) {
  const theAtom: RecoilState<T> = atom({ key, default: def });
  const AtomSubscription = () => {
    const [atomValue, setAtomValue] = useRecoilState(theAtom);
    const atomRef = useRef(atomValue);
    // This makes server-side changes update the atom
    useEffect(() => {
      log(`key: ${key} effect triggered`);
      function handleChange(value) {
        if (JSON.stringify(atomRef.current) !== JSON.stringify(value)) {
          log(`key: ${key} updated to "${value}"`);
          log(value);
          atomRef.current = value;
          setAtomValue(value);
        }
      }
      // Register the listener
      const theID = window.ipc.promiseSub(key, handleChange);
      return function cleanup() {
        window.ipc.promiseUnsub(key, theID);
      };
    }, [atomRef]);

    useEffect(() => {
      if (atomValue !== atomRef.current) {
        atomRef.current = atomValue;
        window.ipcPromise.send('promise-set', {
          key,
          value: atomValue,
        });
      }
      window.ipcPromise.send('promise-get', { key });
    }, [atomValue, atomRef.current]);
    return null;
  };
  return { atom: theAtom, AtomSyncer: AtomSubscription };
}

export const SyncLoc = mkBackAtom('newLocations', []);

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
