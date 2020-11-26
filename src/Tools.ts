// This is for getting at "global" stuff from the window object
import { MakeLogger, Type } from '@freik/core-utils';
import { Album, AlbumKey, Artist, ArtistKey, Song } from '@freik/media-utils';
import { DataForSongGetter, GetDataForSong, SongData } from './DataSchema';

const log = MakeLogger('Tools');

/*
 * Sorting
 */

export type Sorter = (a: string, b: string) => number;

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

const strCmp = (a: string, b: string): number =>
  a.toLocaleUpperCase().localeCompare(b.toLocaleUpperCase());

const theCmp = (a: string, b: string): number =>
  noArticles(a).localeCompare(noArticles(b));

function compareRecord(
  comp: Sorter,
  sort: string,
  a: SongData,
  b: SongData,
): number {
  let result = 0;
  switch (sort.toLowerCase()) {
    case 't':
      result = comp(a.title, b.title);
      break;
    case 'n':
      result = a.track - b.track;
      break;
    case 'l':
      // For an album, it's title, year, key for ties
      result = comp(a.album, b.album);
      if (result === 0) {
        result = a.year - b.year;
        if (result === 0) {
          result = a.albumKey.localeCompare(b.albumKey);
        }
      }
      break;
    case 'r':
      result = comp(a.artist, b.artist);
      break;
  }
  return sort === sort.toUpperCase() ? -result : result;
}

function selectComparator(ignoreArticles: boolean, sortOrder: string) {
  const stringCompare = ignoreArticles ? theCmp : strCmp;
  return (a: SongData, b: SongData): number => {
    for (const s of sortOrder) {
      const res = compareRecord(stringCompare, s, a, b);
      if (res !== 0) {
        return res;
      }
    }
    return 0;
  };
}

/**
 * Sort an array of songs according to a sort order string
 *
 * @param  {string} sortOrder - the Sort Order string
 * @param  {Song[]} songs - The list of songs to be sorted
 * @param  {Map<AlbumKey, Album>} albums - The album map
 * @param  {Map<ArtistKey} artists - The artist map
 * @param  {boolean} articles - should articles be considered during the sort
 * @returns Song
 */
export function SortSongs(
  sortOrder: string,
  songs: Song[],
  albums: Map<AlbumKey, Album>,
  artists: Map<ArtistKey, Artist>,
  articles: boolean,
  getSongData?: DataForSongGetter,
): Song[] {
  const songGetter: DataForSongGetter = getSongData || GetDataForSong;
  log(`sortOrder: ${sortOrder}`);
  log(`songs: ${songs.length} elements`);
  const records: SongData[] = songs.map((song: Song) =>
    songGetter(song, albums, artists),
  );
  return records.sort(selectComparator(articles, sortOrder)).map((r) => r.song);
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
