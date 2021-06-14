// This is a descriptor of what our current sort looks like
// You can sort groupings & subelems independently, but group *always*

import { Type } from '@freik/core-utils';
import { Album, AlbumKey, Artist, ArtistKey, Song } from '@freik/media-core';
import { GetArtistStringFromSong } from './DataSchema';
import { Fail } from './Tools';

// supercedes subelems, allowing groups to function properly
export type SortKey = {
  newSortOrder: (which: string) => SortKey;
  isSorted: (which: string) => boolean;
  isSortedDescending: (which: string) => boolean;
  isSortedAscending: (which: string) => boolean;
  makeSongComparator: (
    albums: Map<AlbumKey, Album>,
    artists: Map<ArtistKey, Artist>,
    ignoreArticles: boolean,
    artistStringMaker?: (s: Song) => string,
  ) => (a: Song, b: Song) => number;
  hasSort: () => boolean;
};

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

// Gotta use this instead of localeCompare, thanks to
// BLUE ÖYSTER CULT and BLUE ÖYSTER CULT being locale equal, but not ===
// which causes problems in the ArtistMap of the Music database
export const stringCompare = (a: string, b: string): number =>
  (a > b ? 1 : 0) - (a < b ? 1 : 0);

export const articlesCmp = (a: string, b: string): number =>
  stringCompare(a.toLocaleUpperCase(), b.toLocaleUpperCase());

export const noArticlesCmp = (a: string, b: string): number =>
  stringCompare(noArticles(a), noArticles(b));

export function MakeSortKey(initial: string): SortKey;
export function MakeSortKey(
  initial: string[],
  groups: string[] | Iterable<[string, number]> | Map<string, number>,
): SortKey;
// initial: The list of initial sorting
export function MakeSortKey(
  initial: string[] | string,
  groups?: string[] | Iterable<[string, number]> | Map<string, number>,
): SortKey {
  const grouping = Type.isString(initial) ? [initial] : [...initial];
  const elems = Type.isUndefined(groups)
    ? // Create the map of everything to element 0
      new Map(
        Array.from(initial).map((val): [string, number] => [
          val.toLocaleLowerCase(),
          0,
        ]),
      )
    : // Create the map of each chracter to its corresponding grouping element
    Type.isMap(groups)
    ? groups
    : new Map<string, number>(
        Type.isArrayOfString(groups)
          ? groups
              .map((val, index): [string, number][] =>
                Array.from(val).map((chr): [string, number] => [
                  chr.toLocaleLowerCase(),
                  index,
                ]),
              )
              .flat()
          : groups,
      );
  // Some validation, just in case...
  elems.forEach((val: number, key: string) => {
    if (val >= grouping.length || val < 0) {
      throw Error(`Index ${val} is out of range for key ${key}`);
    }
    if (key.toLocaleLowerCase() !== key) {
      throw Error(`${key} must be lowercase`);
    }
  });
  function flipChar(char: string, listChar: string): string {
    const loc = listChar.toLocaleLowerCase().indexOf(char);
    if (loc > 0) {
      return char + listChar.substr(0, loc) + listChar.substr(loc + 1);
    } else if (loc === 0) {
      return (
        (listChar[0] !== char ? char : char.toLocaleUpperCase()) +
        listChar.substr(1)
      );
    }
    return char + listChar;
  }
  /**
   * @function NewSortOrder
   * Updates the sorting string to be arranged & capitalized properly give a
   * 'click' on the new key
   *
   * @param {string} which - the letter for the header clicked on
   * @param {string} curSort - the string representing the current sort order
   * @returns {string} the updated sort order string
   */
  function newSortOrder(which: string) {
    // Handle clicking twice to invert the order
    const groupNum = elems.get(which.toLocaleLowerCase());
    if (!Type.isNumber(groupNum)) {
      throw Error('Unexpected');
    }
    const newGroups = grouping.map((theGroup, index) =>
      index !== groupNum
        ? theGroup
        : flipChar(which.toLocaleLowerCase(), theGroup),
    );
    return MakeSortKey(newGroups, elems);
  }
  function isSorted(which: string): boolean {
    for (const i of grouping) {
      for (const j of i) {
        return j.toLocaleUpperCase() === which.toLocaleUpperCase();
      }
    }
    return false;
  }
  function isSpecificSort(which: string): boolean {
    for (const i of grouping) {
      for (const j of i) {
        return j === which;
      }
    }
    return false;
  }
  function makeSongComparator(
    albums: Map<AlbumKey, Album>,
    artists: Map<ArtistKey, Artist>,
    ignoreArticles: boolean,
    artistStringMaker?: (s: Song) => string,
  ): (a: Song, b: Song) => number {
    const strComp = ignoreArticles ? noArticlesCmp : articlesCmp;
    const getArtistString =
      artistStringMaker ?? ((s: Song) => GetArtistStringFromSong(s, artists));
    const sortString = grouping.join('');
    return (a: Song, b: Song): number => {
      for (const c of sortString) {
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
              const vd = stringCompare(v1.vatype, v2.vatype);
              if (vd === 0) {
                continue;
              } else {
                return inverse * vd;
              }
            }
          default:
            failReason = 'Invalid sort order: ' + c;
        }
        Fail('Sorting', failReason);
      }
      return 0;
    };
  }
  return {
    newSortOrder,
    isSorted,
    isSortedAscending: (w: string) => isSpecificSort(w.toLocaleLowerCase()),
    isSortedDescending: (w: string) => isSpecificSort(w.toLocaleUpperCase()),
    makeSongComparator,
    hasSort: () => grouping.join('').length > 0,
  };
}

export function SortItems<TItem>(
  items: TItem[],
  comparator: (a: TItem, b: TItem) => number,
  sliceStart?: number,
  sliceEnd?: number,
): TItem[] {
  const start = Type.isNumber(sliceStart) ? sliceStart : 0;
  const end = Type.isNumber(sliceEnd) ? sliceEnd : items.length;
  if (start === 0 && end === items.length) {
    return [...items].sort(comparator);
  } else {
    const middle = items.slice(start, end).sort(comparator);
    return [...items.slice(0, start), ...middle, ...items.slice(end)];
  }
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
  sortOrder: SortKey,
): Song[] {
  return SortItems(
    songs,
    sortOrder.makeSongComparator(albums, artists, articles),
  );
}
