import { AlbumKey, ArtistKey, MediaKey } from '@freik/media-core';
import { atomFamily, selectorFamily } from 'recoil';
import { RandomInt } from '../Tools';

/* This stuff is to make it so that pic URL's will refresh, when we update
 * the "picCacheAvoider" for a particularly album cover
 * It's efficacy is not guaranteed, but it's a best effort, i guess
 */
export const picCacheAvoiderStateFam = atomFamily<number, MediaKey>({
  key: 'picCacheAvoider',
  default: RandomInt(0x3fffffff),
});

export const albumCoverUrlFuncFam = selectorFamily<string, AlbumKey>({
  key: 'albumCoverUrl',
  get: (key: AlbumKey) => () => {
    return `pic://key/${key}`;
  },
});

export const artistImageUrlFuncFam = selectorFamily<string, ArtistKey>({
  key: 'artistImageUrl',
  get: (key: ArtistKey) => () => {
    return `pic://key/${key}`;
  },
});
