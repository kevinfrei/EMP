// @flow

import {
  atom,
  selector,
  atomFamily,
  selectorFamily,
  useRecoilState,
} from 'recoil';
import logger from '@freik/simplelogger';
import { useRef, useEffect } from 'react';
import { FTON } from '@freik/core-utils';

import type { SongKey, Song, Artist, Album, MediaInfo } from './MyStore';
import type { RecoilState } from 'recoil';

const log = logger.bind('Atoms');
logger.enable('Atoms');

export type syncedAtom<T> = {
  atom: RecoilState<T>,
  AtomSyncer: () => React$Node,
};
// This should return a server-sync'ed atom
// { atom: theAtom, AtomSyncer: AtomSubscription };
function makeBackedAtom<T>(key: string, def: T): syncedAtom<T> {
  const theAtom: RecoilState<T> = atom({ key, default: def });
  const AtomSubscription = (): React$Node => {
    const [atomValue, setAtomValue] = useRecoilState(theAtom);
    const atomRef = useRef(atomValue);
    // This makes server-side changes update the atom
    useEffect(() => {
      log(`key: ${key} effect triggered`);
      function handleChange(value) {
        if (FTON.stringify(atomRef.current) !== FTON.stringify(value)) {
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
      if (FTON.stringify(atomValue) !== FTON.stringify(atomRef.current)) {
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

// This is the 'locations' for searching
export const SyncLoc = makeBackedAtom('newLocations', []);

export const getMediaInfo = selectorFamily({
  key: 'mediaInfoSelector',
  get: (id) => async (param: SongKey) => {
    const result = await window.ipcPromise.send('promise-mediaInfo', id);
    return result.data;
  },
});

export const SortWithArticles = makeBackedAtom('rSortWithArticles', true);

export const AlbumListSort = makeBackedAtom('rAlbumListSort', 'ArtistName');

export const ArtistListSort = makeBackedAtom('rArtistListSort', 'ArtistAlbum');

export const SongListSort = makeBackedAtom('rSongListSort', 'ArtistAlbum');
