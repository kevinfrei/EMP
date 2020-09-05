import {
  atom,
  selectorFamily,
  useRecoilState,
} from 'recoil';
import { logger } from '@freik/simplelogger';
import { useRef, useEffect } from 'react';
import { FTON } from '@freik/core-utils';

import type { SongKey } from './MyStore';
import type { RecoilState } from 'recoil';
import type { MyWindow } from './AsyncDoodad';
import type { FTONData } from '@freik/core-utils';
declare let window: MyWindow;

const log = logger.bind('Atoms');
logger.enable('Atoms');

export type syncedAtom<T> = {
  atom: RecoilState<T | null>;
  AtomSyncer: () => JSX.Element | null;
};

export type MediaInfo = {
  general: Map<string, string>;
  audio: Map<string, string>;
};

// This should return a server-sync'ed atom
// { atom: theAtom, AtomSyncer: AtomSubscription };
function makeBackedAtom<T>(key: string, def: T): syncedAtom<T> {
  const theAtom: RecoilState<T | null> = atom<T | null>({ key, default: def });
  const AtomSyncer = (): JSX.Element | null => {
    const [atomValue, setAtomValue] = useRecoilState(theAtom);
    const atomRef = useRef<T | null>(atomValue);

    // This makes server-side changes update the atom
    useEffect(() => {
      log(`key: ${key} effect triggered`);
      function handleChange(value: T) {
        if (
          atomRef &&
          FTON.stringify(atomRef.current as FTONData) !==
            FTON.stringify((value as unknown) as FTONData)
        ) {
          log(`key: ${key} updated to:`);
          log(value);
          atomRef.current = value;
          setAtomValue(value);
        }
      }
      // Register the listener
      const theID = window.ipc!.promiseSub(key, handleChange as any);
      return function cleanup() {
        window.ipc!.promiseUnsub(key, theID);
      };
    }, [atomRef, setAtomValue]);

    // This updates the server whenever the value or the ref changes
    useEffect(() => {
      if (
        FTON.stringify(atomValue as any) !==
        FTON.stringify(atomRef.current as any)
      ) {
        atomRef.current = atomValue;
        void window.ipcPromise!.send('promise-set', {
          key,
          value: atomValue,
        });
      }
      void window.ipcPromise!.send('promise-get', { key });
    }, [atomValue, atomRef]);
    return null;
  };
  return { atom: theAtom, AtomSyncer };
}

// This is the 'locations' for searching
export const SyncLoc = makeBackedAtom<string[]>('newLocations', []);

export const getMediaInfo = selectorFamily<any, SongKey>({
  key: 'mediaInfoSelector',
  // eslint-disable-next-line
  get: ((id: SongKey) => async (param: SongKey) => {
    const result = await window.ipcPromise!.send('promise-mediaInfo', id);
    return (result as any).data; // eslint-disable-line
  }) as any,
});

export const SortWithArticles = makeBackedAtom<boolean>(
  'rSortWithArticles',
  true,
);

export const AlbumListSort = makeBackedAtom<string>(
  'rAlbumListSort',
  'ArtistName',
);

export const ArtistListSort = makeBackedAtom<string>(
  'rArtistListSort',
  'ArtistAlbum',
);

export const SongListSort = makeBackedAtom<string>(
  'rSongListSort',
  'ArtistAlbum',
);
