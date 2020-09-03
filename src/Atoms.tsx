import {
  atom,
  selector,
  atomFamily,
  selectorFamily,
  useRecoilState,
} from 'recoil';
import { logger } from '@freik/simplelogger';
import { useRef, useEffect } from 'react';
import { FTON, FTONData } from '@freik/core-utils';
import { IpcRendererEvent } from 'electron/main';

import type { SongKey, Song, Artist, Album, MediaInfo } from './MyStore';
import type { RecoilState } from 'recoil';
import type { MyWindow } from './AsyncDoodad';
declare var window: MyWindow;

const log = logger.bind('Atoms');
logger.enable('Atoms');

export type syncedAtom<T> = {
  atom: RecoilState<T | null>;
  AtomSyncer: () => JSX.Element | null;
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
      function handleChange(value: unknown) {
        if (
          atomRef &&
          FTON.stringify(atomRef.current as any) !==
            FTON.stringify(value as any)
        ) {
          log(`key: ${key} updated to "${value}"`);
          log(value);
          atomRef.current = value as T;
          setAtomValue(value as T);
        }
      }
      // Register the listener
      const theID = window.ipc!.promiseSub(key, handleChange);
      return function cleanup() {
        window.ipc!.promiseUnsub(key, theID);
      };
    }, [atomRef]);

    // This updates the server whenever the value or the ref changes
    useEffect(() => {
      if (
        FTON.stringify(atomValue as any) !==
        FTON.stringify(atomRef.current as any)
      ) {
        atomRef.current = atomValue;
        window.ipcPromise!.send('promise-set', {
          key,
          value: atomValue,
        });
      }
      window.ipcPromise!.send('promise-get', { key });
    }, [atomValue, atomRef.current]);
    return null;
  };
  return { atom: theAtom, AtomSyncer };
}

// This is the 'locations' for searching
export const SyncLoc = makeBackedAtom<string[]>('newLocations', []);

export const getMediaInfo = selectorFamily({
  key: 'mediaInfoSelector',
  get: ((id: any) => async (param: SongKey) => {
    const result = await window.ipcPromise!.send('promise-mediaInfo', id);
    return (result as any).data;
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
