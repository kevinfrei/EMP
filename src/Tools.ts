// This is for getting at "global" stuff from the window object
import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { stringCompare } from './Sorting';

const log = MakeLogger('Tools');
const err = MakeError('Tools-err');

/*
 * Searching
 */

export function GetIndexOf<T>(
  sortedValues: T[],
  searchString: string,
  selector: (s: T) => string,
): number {
  // Binary search, assuming the songs are sorted in either ascending or
  // descending value of the selector
  const ascending =
    stringCompare(
      selector(sortedValues[0]),
      selector(sortedValues[sortedValues.length - 1]),
    ) > 0;
  const before = (a: number): boolean => {
    const sort = stringCompare(selector(sortedValues[a]), searchString) < 0;
    return ascending ? sort : !sort;
  };
  let lo = 0;
  let hi = sortedValues.length - 1;
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

export function isPlaylist(playlist?: string): boolean {
  return Type.isString(playlist) && playlist.length > 0;
}

export function RandomInt(max: number): number {
  const values = new Uint32Array(4);
  window.crypto.getRandomValues(values);
  return values[0] % max;
}

export function ShuffleArray<T>(array: T[]): T[] {
  const values = new Uint32Array(array.length);
  window.crypto.getRandomValues(values);
  const rand = (max: number) => values[max - 1] % max;
  const res: T[] = [];
  const remove: T[] = [...array];
  while (remove.length > 0) {
    const i = rand(remove.length);
    res.push(remove[i]);
    remove.splice(i, 1);
  }
  return res;
}

export function secondsToTime(val: number): string {
  const expr = new Date(val * 1000).toISOString();
  if (val < 600) {
    return expr.substr(15, 4);
  } else if (val < 3600) {
    return expr.substr(14, 5);
  } else if (val < 36000) {
    return expr.substr(12, 7);
  } else {
    return expr.substr(11, 8);
  }
}

export function fractionalSecondsStrToHMS(vals: string): string {
  const decimal = vals.indexOf('.');
  let suffix: string = decimal > 0 ? vals.substr(decimal) : '';
  suffix = suffix.replace(/0+$/g, '');
  suffix = suffix.length === 1 ? '' : suffix.substr(0, 3);
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

export function Fail(name?: string, message?: string): never {
  const e = new Error();
  if (Type.isString(name)) {
    e.name = name;
  }
  if (Type.isString(message)) {
    e.message = message;
  }
  throw e;
}

// eslint-disable-next-line
export function Catch(e: any, msg?: string): void {
  if (msg) {
    err(msg);
  }
  if (e instanceof Error) {
    err(e);
  } else if (Type.has(e, 'toString') && Type.isFunction(e.toString)) {
    err(e.toString());
  }
}

// eslint-disable-next-line
export function onRejected(msg?: string): (reason: any) => void {
  return (reason: any) => {
    if (Type.isString(msg)) {
      err(msg);
    }
    err(reason);
  };
}
