// This is for getting at "global" stuff from the window object
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  MakeLogger,
  Song,
  Type,
} from '@freik/core-utils';
import { GetArtistStringFromSong } from './DataSchema';

const log = MakeLogger('Tools');

/*
 * Sorting
 */

export function noArticles(phrase: string): string {
  const res = phrase.toLocaleUpperCase();
  if (res.startsWith('THE ')) {
    return res.substr(4);
  } else if (res.startsWith('A ')) {
    return res.substr(2);
  } else if (res.startsWith('AN ')) {
    return res.substr(3);
  }
  return res;
}

const articlesCmp = (a: string, b: string): number =>
  a.toLocaleUpperCase().localeCompare(b.toLocaleUpperCase());

const noArticlesCmp = (a: string, b: string): number =>
  noArticles(a).localeCompare(noArticles(b));

export function SortItems<TItem>(
  items: TItem[],
  comparator: (a: TItem, b: TItem) => number,
): TItem[] {
  return [...items].sort(comparator);
}

export function MakeSongComparator(
  albums: Map<AlbumKey, Album>,
  artists: Map<ArtistKey, Artist>,
  ignoreArticles: boolean,
  sortOrder: string,
  artistStringMaker?: (s: Song) => string,
): (a: Song, b: Song) => number {
  const strComp = ignoreArticles ? noArticlesCmp : articlesCmp;
  const getArtistString =
    artistStringMaker ?? ((s: Song) => GetArtistStringFromSong(s, artists));
  return (a: Song, b: Song): number => {
    for (const c of sortOrder) {
      const inverse = c === c.toLocaleUpperCase() ? -1 : 1;
      let failReason = '';
      switch (c.toLocaleUpperCase()) {
        case 'L':
          // Album title
          const l1 = albums.get(a.albumId);
          const l2 = albums.get(b.albumId);
          if (!l1) {
            failReason = 'Invalid album ID ' + a.albumId;
          } else if (!l2) {
            failReason = 'Invalid album ID ' + b.albumId;
          } else {
            const ld = strComp(l1.title, l2.title);
            if (ld === 0) {
              continue;
            } else {
              return inverse * ld;
            }
          }
          break;
        case 'R':
          const r1 = getArtistString(a);
          const r2 = getArtistString(b);
          if (r1.length === 0) {
            failReason = `Invalid artist IDs [${a.artistIds.join(', ')}]`;
          } else if (r2.length === 0) {
            failReason = `Invalid artist IDs [${b.artistIds.join(', ')}]`;
          } else {
            const rd = strComp(r1, r2);
            if (rd === 0) {
              continue;
            } else {
              return inverse * rd;
            }
          }
          break;
        case 'T':
          // Track title
          const td = strComp(a.title, b.title);
          if (td === 0) {
            continue;
          } else {
            return inverse * td;
          }
        case 'N':
          // Track number
          const nd = a.track - b.track;
          if (nd === 0) {
            continue;
          } else {
            return inverse * nd;
          }
        case 'Y':
          // Album year
          const y1 = albums.get(a.albumId);
          const y2 = albums.get(b.albumId);
          if (!y1) {
            failReason = 'Invalid album ID ' + a.albumId;
          } else if (!y2) {
            failReason = 'Invalid album ID ' + b.albumId;
          } else {
            const yd = y1.year - y2.year;
            if (yd === 0) {
              continue;
            } else {
              return inverse * yd;
            }
          }
          break;
        case 'V':
          // VA type
          const v1 = albums.get(a.albumId);
          const v2 = albums.get(b.albumId);
          if (!v1) {
            failReason = 'Invalid album ID ' + a.albumId;
          } else if (!v2) {
            failReason = 'Invalid album ID ' + b.albumId;
          } else {
            const vd = v1.vatype.localeCompare(v2.vatype);
            if (vd === 0) {
              continue;
            } else {
              return inverse * vd;
            }
          }
        default:
          failReason = 'Invalid sort order: ' + c;
      }
      throw new Error(failReason);
    }
    return 0;
  };
}

/**
 * Sort an array of songs according to a sort order string
 *
 * @param  {Song[]} songs - The list of songs to be sorted
 * @param  {Map<AlbumKey, Album>} albums - The album map
 * @param  {Map<ArtistKey} artists - The artist map
 * @param  {boolean} articles - should articles be considered during the sort
 * @param  {string} sortOrder - the Sort Order string
 * @returns Song[]
 */
export function SortSongList(
  songs: Song[],
  albums: Map<AlbumKey, Album>,
  artists: Map<ArtistKey, Artist>,
  articles: boolean,
  sortOrder: string,
): Song[] {
  return SortItems(
    songs,
    MakeSongComparator(albums, artists, articles, sortOrder),
  );
}

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
    selector(sortedValues[0]).localeCompare(
      selector(sortedValues[sortedValues.length - 1]),
    ) > 0;
  const before = (a: number): boolean => {
    const sort = selector(sortedValues[a]).localeCompare(searchString) < 0;
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
