// This is for getting at "global" stuff from the window object
import { MakeLog } from '@freik/logger';
import { AlbumKey, ArtistKey, PlaylistName } from '@freik/media-core';
import { hasField, isObjectNonNull, isString } from '@freik/typechk';
import { ForwardedRef, MutableRefObject } from 'react';

const { log } = MakeLog('EMP:render:Tools');

/*
 * Searching
 */

/**
 * Binary search a sorted set of items, finding either the value, or it's
 * closest relative
 *
 * @param  {T[]} sortedItems
 * @param  {E} searchValue
 * @param  {(v:T)=>E} selector
 * @param  {(a:E,b:E)=>number} comparator
 * @returns number
 */
export function GetIndexOf<T, E>(
  sortedItems: T[],
  searchValue: E,
  selector: (v: T) => E,
  comparator: (a: E, b: E) => number,
): number {
  // Binary search, assuming the items are sorted in either ascending or
  // descending value of the selector
  const ascending =
    comparator(
      selector(sortedItems[0]),
      selector(sortedItems[sortedItems.length - 1]),
    ) > 0;
  const before = (a: number): boolean => {
    const sort = comparator(selector(sortedItems[a]), searchValue) < 0;
    return ascending ? sort : !sort;
  };
  let lo = 0;
  let hi = sortedItems.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (before(mid)) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  log(lo);
  return lo;
}

/*
 * Miscellaney
 */

export function isPlaylist(playlist?: string): playlist is PlaylistName {
  return isString(playlist) && playlist.length > 0;
}

export function RandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function ShuffleArray<T>(array: T[]): T[] {
  const res = [...array];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = res[i];
    res[i] = res[j];
    res[j] = t;
  }
  return res;
}

export function secondsToTime(val: number): string {
  const expr = new Date(val * 1000).toISOString();
  if (val < 600) {
    return expr.substring(15, 19);
  } else if (val < 3600) {
    return expr.substring(14, 19);
  } else if (val < 36000) {
    return expr.substring(12, 19);
  } else {
    return expr.substring(11, 19);
  }
}

export function fractionalSecondsStrToHMS(vals: string): string {
  const decimal = vals.indexOf('.');
  let suffix: string = decimal > 0 ? vals.substring(decimal) : '';
  suffix = suffix.replace(/0+$/g, '');
  suffix = suffix.length === 1 ? '' : suffix.substring(0, 3);
  const val = parseInt(vals, 10);
  return secondsToTime(val) + suffix;
}

export function divGrand(val: string): string {
  let flt = (parseFloat(val) / 1000.0).toPrecision(4);
  if (flt.indexOf('.') < 0) {
    return flt;
  }
  flt = flt.replace(/0+$/g, '');
  flt = flt.replace(/\.$/, '');
  return flt;
}

export function isMutableRefObject<T>(
  ref: ForwardedRef<T>,
): ref is MutableRefObject<T> {
  return (
    isObjectNonNull(ref) &&
    hasField(ref, 'current') &&
    isObjectNonNull(ref.current)
  );
}

export function getAlbumImageUrl(albumKey: AlbumKey) {
  return `pic://key/${albumKey}`;
}

export function getArtistImageUrl(artistKey: ArtistKey) {
  return `pic://key/${artistKey}`;
}
