import { MediaKey } from '@freik/media-core';
import { atomFamily } from 'recoil';
import { RandomInt } from '../Tools';

/* This stuff is to make it so that pic URL's will refresh, when we update
 * the "picCacheAvoider" for a particularly album cover
 * It's efficacy is not guaranteed, but it's a best effort, i guess
 */
export const picCacheAvoiderStateFam = atomFamily<number, MediaKey>({
  key: 'picCacheAvoider',
  default: RandomInt(0x3fffffff),
});
