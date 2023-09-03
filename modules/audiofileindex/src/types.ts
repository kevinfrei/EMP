import { Song } from '@freik/media-core';
import { isString, typecheck } from '@freik/typechk';

export type VAType = '' | 'ost' | 'va';
export type SongWithPath = Song & { path: string };
export type IgnoreType =
  /*
  | 'artist-name'
  | 'album-title'
  | 'track-title'
  */
  'path-root' | 'path-keyword' | 'dir-name';

export const chkIgoreType: typecheck<IgnoreType> = (
  val: unknown,
): val is IgnoreType =>
  isString(val) &&
  (val === 'path-root' || val === 'path-keyword' || val === 'dir-name');
