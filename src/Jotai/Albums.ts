import { AlbumKey } from '@freik/media-core';
import { Fail } from '@freik/web-utils';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { musicLibraryState } from './MusicLibrary';

export const allAlbumsState = atom((get) => {
  return get(musicLibraryState).albums;
});

export const maybeAlbumByKey = atomFamily((ak: AlbumKey) =>
  atom(async (get) => await get(allAlbumsState).get(ak)),
);

export const albumByKey = atomFamily((ak: AlbumKey) =>
  atom(async (get) => {
    const album = await get(maybeAlbumByKey(ak));
    if (!album) {
      Fail(ak, 'Unfound album key');
    }
    return album;
  }),
);
