// This is a descriptor of what our current sort looks like
// You can sort groupings & subelems independently, but group *always*

import { IGroup } from '@fluentui/react';
import { MakeMultiMap, MultiMap, Type } from '@freik/core-utils';
import { Album, AlbumKey, Artist, ArtistKey, Song } from '@freik/media-core';
import { SongKey } from '@freik/media-utils/lib/metadata';
import { GetArtistStringFromKeys, GetArtistStringFromSong } from './DataSchema';
import { Fail } from './Tools';

export type ArtistSong = Song & { sortedArtistId: ArtistKey; comboKey: string };

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
  makeArtistComparator: (
    ignoreArticles: boolean,
  ) => (a: Artist, b: Artist) => number;
  makeSongArtistComparator: (
    artists: Map<ArtistKey, Artist>,
    albums: Map<AlbumKey, Album>,
    ignoreArticles: boolean,
  ) => (a: Song, b: Song) => number;
  hasSort: () => boolean;
  getGrouping: () => string[];
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

// This helper prepends 'char' to 'listOfChars', and flips the case (if it was)
// already in 'listOfChars'
function flipChar(char: string, listOfChars: string): string {
  const loc = listOfChars.toLocaleLowerCase().indexOf(char);
  if (loc > 0) {
    return char + listOfChars.substr(0, loc) + listOfChars.substr(loc + 1);
  } else if (loc === 0) {
    return (
      (listOfChars[0] !== char ? char : char.toLocaleUpperCase()) +
      listOfChars.substr(1)
    );
  }
  return char + listOfChars;
}

// A helper to return a compare/fail tuple for a lookup-based comparison that
// could fail (catastrophically, most likely)
function cmpFail<T, U>(
  aItem: T,
  bItem: T,
  func: (item: T) => U | undefined,
  compare: (i: U, j: U) => number,
): number | string {
  const a = func(aItem);
  const b = func(bItem);
  if (Type.isUndefined(a)) {
    return 'Invalid item';
  } else if (Type.isUndefined(b)) {
    return 'Invalid item';
  } else {
    return compare(a, b);
  }
}

function MakeCompareLoop<T>(
  sortString: string,
  cmps: Iterable<[string, (a: T, b: T) => number | string]>,
): (a: T, b: T) => number {
  const lookup = new Map(cmps);
  return (a: T, b: T) => {
    for (const c of sortString) {
      const comp = lookup.get(c.toLocaleUpperCase());
      if (comp) {
        const res = comp(a, b);
        if (Type.isString(res)) {
          Fail('Comparison lookup failure', res);
        } else if (res !== 0) {
          return c === c.toLocaleUpperCase() ? -res : res;
        }
      } else {
        Fail('Invalid compare character ' + c);
      }
    }
    return 0;
  };
}

export function MakeSortKey(initial: string | string[]): SortKey;
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
  // grouping is the list of currently specified sorting strings.
  const grouping: string[] = Type.isString(initial) ? [initial] : [...initial];
  const elems: MultiMap<string, number> = MakeSortKeyMultiMap(initial, groups);

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
        ? flipChar(which.toLocaleLowerCase(), theGroup)
        : theGroup,
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
    const getAlbum = (s: Song) => albums.get(s.albumId);
    return MakeCompareLoop<Song>(grouping.join(''), [
      [
        'L', // Album title
        (a, b) => cmpFail(a, b, getAlbum, (i, j) => strComp(i.title, j.title)),
      ],
      [
        'R', // Artist
        (a, b) => cmpFail(a, b, (s: Song) => getArtistString(s), strComp),
      ],
      [
        'T', // Track title
        (a, b) => strComp(a.title, b.title),
      ],
      [
        'N', // Track number
        (a, b) => a.track - b.track,
      ],
      [
        'Y', // Album year
        (a, b) => cmpFail(a, b, getAlbum, (i, j) => i.year - j.year),
      ],
      [
        'V', // VA Type
        (a, b) =>
          cmpFail(a, b, getAlbum, (i, j) => strComp(i.vatype, j.vatype)),
      ],
    ]);
  }
  function makeAlbumComparator(
    artists: Map<ArtistKey, Artist>,
    ignoreArticles: boolean,
  ): (a: Album, b: Album) => number {
    const strComp = ignoreArticles ? noArticlesCmp : articlesCmp;
    return MakeCompareLoop<Album>(grouping[0], [
      [
        'L', // Album title
        (a, b) => strComp(a.title, b.title),
      ],
      [
        'R', // Primary Artist string
        (a, b) =>
          cmpFail(
            a,
            b,
            (l) => GetArtistStringFromKeys(l.primaryArtists, artists),
            strComp,
          ),
      ],
      [
        'Q', // Track Quantity
        (a, b) => a.songs.length - b.songs.length,
      ],
      [
        'D', // Disk Count
        (a, b) =>
          (a.diskNames ? a.diskNames.length : 1) -
          (b.diskNames ? b.diskNames.length : 1),
      ],
      [
        'Y', // Album year
        (a, b) => a.year - b.year,
      ],
      [
        'V', // VA type
        (a, b) => strComp(a.vatype, b.vatype),
      ],
    ]);
  }
  function makeSongAlbumComparator(
    artists: Map<ArtistKey, Artist>,
    ignoreArticles: boolean,
  ): (a: Song, b: Song) => number {
    const strComp = ignoreArticles ? noArticlesCmp : articlesCmp;
    return MakeCompareLoop<Song>(grouping[1], [
      [
        'R', // Artist
        (a, b) =>
          cmpFail(a, b, (s) => GetArtistStringFromSong(s, artists), strComp),
      ],
      [
        'T', // Track title
        (a, b) => strComp(a.title, b.title),
      ],
      [
        'N', // Track number
        (a, b) => a.track - b.track,
      ],
    ]);
  }
  function makeArtistComparator(
    ignoreArticles: boolean,
  ): (a: Artist, b: Artist) => number {
    const strComp = ignoreArticles ? noArticlesCmp : articlesCmp;
    return MakeCompareLoop<Artist>(grouping[0], [
      [
        'R', // Artist Name
        (a, b) => strComp(a.name, b.name),
      ],
      [
        'Q', // Quantity of Songs
        (a, b) => a.songs.length - b.songs.length,
      ],
      [
        'C', // Count of Albums,
        (a, b) => a.albums.length - b.albums.length,
      ],
    ]);
  }
  function makeSongArtistComparator(
    artists: Map<ArtistKey, Artist>,
    albums: Map<AlbumKey, Album>,
    ignoreArticles: boolean,
  ): (a: Song, b: Song) => number {
    const strComp = ignoreArticles ? noArticlesCmp : articlesCmp;
    return MakeCompareLoop<Song>(grouping[1], [
      [
        'T', // Track title
        (a, b) => strComp(a.title, b.title),
      ],
      [
        'N', // Track number
        (a, b) => a.track - b.track,
      ],
      [
        'L', // Album name
        (a, b) =>
          cmpFail(
            a,
            b,
            (s) => albums.get(s.albumId),
            (i, j) => strComp(i.title, j.title),
          ),
      ],
      [
        'Y', // Album year
        (a, b) =>
          cmpFail(
            a,
            b,
            (s) => albums.get(s.albumId),
            (i, j) => i.year - j.year,
          ),
      ],
    ]);
  }

  return {
    newSortOrder,
    isSorted,
    isSortedAscending: (w: string) => isSpecificSort(w.toLocaleLowerCase()),
    isSortedDescending: (w: string) => isSpecificSort(w.toLocaleUpperCase()),
    makeSongComparator,
    makeAlbumComparator,
    makeSongAlbumComparator,
    makeArtistComparator,
    makeSongArtistComparator,
    hasSort: () => grouping.join('').length > 0,
    getGrouping: () => [...grouping],
  };
}

export function SortItems<TItem>(
  items: Iterable<TItem>,
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

export function SortSongsFromAlbums(
  unsortedAlbums: Iterable<Album>,
  songMap: Map<SongKey, Song>,
  artists: Map<ArtistKey, Artist>,
  articles: boolean,
  sortOrder: SortKey,
): { songs: Song[]; groups: IGroup[] } {
  const albums = SortItems(
    unsortedAlbums,
    sortOrder.makeAlbumComparator(artists, articles),
  );
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
  return { songs, groups };
}

export function SortSongsFromArtists(
  unsortedArtists: Iterable<Artist>,
  artistMap: Map<ArtistKey, Artist>,
  albumMap: Map<AlbumKey, Album>,
  songMap: Map<SongKey, Song>,
  articles: boolean,
  sortOrder: SortKey,
): { songs: ArtistSong[]; groups: IGroup[] } {
  const artists = SortItems(
    unsortedArtists,
    sortOrder.makeArtistComparator(articles),
  );
  const comparator = sortOrder.makeSongArtistComparator(
    artistMap,
    albumMap,
    articles,
  );
  // Count the songs
  const total = artists.reduce(
    (prv: number, curArt: Artist) => prv + curArt.songs.length,
    0,
  );
  const songs = new Array<ArtistSong>(total);
  const groups: IGroup[] = artists.map((artist) => ({
    key: artist.key,
    name: artist.name,
    startIndex: -1,
    count: -1,
  }));
  let songIndex = 0;
  let groupIndex = 0;
  // Sort each group
  for (const artist of artists) {
    const songSortTmp = SortItems(
      artist.songs
        .map((sk) => songMap.get(sk) as Song)
        .filter((s) => !Type.isUndefined(s)),
      comparator,
    );
    groups[groupIndex].startIndex = songIndex;
    groups[groupIndex].count = songSortTmp.length;
    for (const s of songSortTmp) {
      songs[songIndex++] = {
        sortedArtistId: artist.key,
        comboKey: `C:${s.key};${artist.key}`,
        ...s,
      };
    }
    groupIndex++;
  }
  return { songs, groups };
}
