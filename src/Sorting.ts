// This is a descriptor of what our current sort looks like
// You can sort groupings & subelems independently, but group *always*

import { IGroup } from '@fluentui/react';
import { MakeMultiMap, MultiMap, Type } from '@freik/core-utils';
import { Album, AlbumKey, Artist, ArtistKey, Song } from '@freik/media-core';
import { SongKey } from '@freik/media-utils/lib/metadata';
import { GetArtistStringFromKeys, GetArtistStringFromSong } from './DataSchema';
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
  makeAlbumComparator: (
    artists: Map<ArtistKey, Artist>,
    ignoreArticles: boolean,
  ) => (a: Album, b: Album) => number;
  makeSongAlbumComparator: (
    artists: Map<ArtistKey, Artist>,
    ignoreArticles: boolean,
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

export function MakeSortKeyMultiMap(
  initial: string | string[],
  groups?:
    | string[]
    | Iterable<[string, Iterable<number>]>
    | MultiMap<string, number>,
): MultiMap<string, number> {
  if (Type.isUndefined(groups) || Type.isArrayOfString(groups)) {
    const res = MakeMultiMap<string, number>();
    const list = groups || (Type.isString(initial) ? [initial] : initial);
    list.forEach((str, index) => {
      str.split('').forEach((val) => res.set(val, index));
    });
    return res;
  } else if (Type.isMultiMapOf(groups, Type.isString, Type.isNumber)) {
    return groups;
  } else {
    return MakeMultiMap([...groups]);
  }
}

export function MakeSortKey(initial: string): SortKey;
export function MakeSortKey(
  initial: string[],
  groups:
    | string[]
    | Iterable<[string, Iterable<number>]>
    | MultiMap<string, number>,
): SortKey;
// initial: The list of initial sorting
export function MakeSortKey(
  initial: string[] | string,
  groups?:
    | string[]
    | Iterable<[string, Iterable<number>]>
    | MultiMap<string, number>,
): SortKey {
  const grouping = Type.isString(initial) ? [initial] : [...initial];
  const elems = MakeSortKeyMultiMap(initial, groups);
  // Some validation, just in case...
  elems.forEach((vals: Set<number>, key: string) => {
    for (const val of vals) {
      if (val >= grouping.length || val < 0) {
        Fail(`Index ${val} is out of range for key ${key}`);
      }
      if (key.toLocaleLowerCase() !== key) {
        Fail(`${key} must be lowercase`);
      }
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
    if (Type.isUndefined(groupNum)) {
      Fail('Unexpected');
    }
    const newGroups = grouping.map((theGroup, index) =>
      groupNum.has(index)
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
  function makeAlbumComparator(
    artists: Map<ArtistKey, Artist>,
    ignoreArticles: boolean,
  ): (a: Album, b: Album) => number {
    const strComp = ignoreArticles ? noArticlesCmp : articlesCmp;
    /* 
    const getArtistString =
      artistStringMaker ?? ((l: Album) => GetArtistStringFromKeys(l.primaryArtists, artists));
    */
    const sortString = grouping[0];
    return (a: Album, b: Album): number => {
      for (const c of sortString) {
        const inverse = c === c.toLocaleUpperCase() ? -1 : 1;
        let failReason = '';
        switch (c.toLocaleUpperCase()) {
          case 'L':
            // Album title
            const ld = strComp(a.title, b.title);
            if (ld === 0) {
              continue;
            } else {
              return inverse * ld;
            }
            break;
          case 'R':
            const r1 = GetArtistStringFromKeys(a.primaryArtists, artists);
            const r2 = GetArtistStringFromKeys(b.primaryArtists, artists);
            if (r1.length === 0) {
              failReason = `Invalid artistIDs [${a.primaryArtists.join(', ')}]`;
            } else if (r2.length === 0) {
              failReason = `Invalid artistIDs [${b.primaryArtists.join(', ')}]`;
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
            // Track Quantity
            const td = a.songs.length - b.songs.length;
            if (td === 0) {
              continue;
            } else {
              return inverse * td;
            }
          case 'D':
            // Disk Count
            const and = a.diskNames ? a.diskNames.length : 1;
            const bnd = b.diskNames ? b.diskNames.length : 1;
            const nd = and - bnd;
            if (nd === 0) {
              continue;
            } else {
              return inverse * nd;
            }
          case 'Y':
            // Album year
            const yd = a.year - b.year;
            if (yd === 0) {
              continue;
            } else {
              return inverse * yd;
            }
            break;
          case 'V':
            // VA type
            const vd = stringCompare(a.vatype, b.vatype);
            if (vd === 0) {
              continue;
            } else {
              return inverse * vd;
            }
          default:
            failReason = 'Invalid sort order: ' + c;
        }
        Fail('Sorting', failReason);
      }
      return 0;
    };
  }
  function makeSongAlbumComparator(
    artists: Map<ArtistKey, Artist>,
    ignoreArticles: boolean,
  ): (a: Song, b: Song) => number {
    const strComp = ignoreArticles ? noArticlesCmp : articlesCmp;
    const sortString = grouping[1];
    return (a: Song, b: Song): number => {
      for (const c of sortString) {
        const inverse = c === c.toLocaleUpperCase() ? -1 : 1;
        let failReason = '';
        switch (c.toLocaleUpperCase()) {
          case 'R':
            const r1 = GetArtistStringFromSong(a, artists);
            const r2 = GetArtistStringFromSong(b, artists);
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
    makeAlbumComparator,
    makeSongAlbumComparator,
    hasSort: () => grouping.join('').length > 0,
  };
}

export function SortItems<TItem>(
  items: TItem[],
  comparator: (a: TItem, b: TItem) => number,
): TItem[] {
  return [...items].sort(comparator);
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

export function SortAlbumList(
  albums: Album[],
  artists: Map<ArtistKey, Artist>,
  articles: boolean,
  sortOrder: SortKey,
): Album[] {
  return SortItems(albums, sortOrder.makeAlbumComparator(artists, articles));
}

export function SortSongsFromAlbums(
  albums: Album[],
  songMap: Map<SongKey, Song>,
  artists: Map<ArtistKey, Artist>,
  articles: boolean,
  sortOrder: SortKey,
): { songs: Song[]; groups: IGroup[] } {
  const comparator = sortOrder.makeSongAlbumComparator(artists, articles);
  // Count the # of songs
  const total = albums.reduce(
    (prv: number, curAlb: Album) => prv + curAlb.songs.length,
    0,
  );
  const songs: Song[] = new Array<Song>(total);
  const groups: IGroup[] = albums.map((lbm) => ({
    key: lbm.key,
    name: lbm.title,
    startIndex: -1,
    count: -1,
  }));
  let songIndex = 0;
  let groupIndex = 0;
  // Sort each group
  for (const album of albums) {
    const songSortTmp = SortItems(
      album.songs
        .map((sk) => songMap.get(sk) as Song)
        .filter((s) => !Type.isUndefined(s)),
      comparator,
    );
    groups[groupIndex].startIndex = songIndex;
    groups[groupIndex].count = songSortTmp.length;
    for (const s of songSortTmp) {
      songs[songIndex++] = s;
    }
    groupIndex++;
  }
  // TODO: Make this return an IGroup thing too, while we're at it, right?
  return { songs, groups };
}
