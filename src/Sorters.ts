import { GetDataForSong } from './DataSchema';

import type {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
} from '@freik/media-utils';

export type Sorter = (a: string, b: string) => number;

function noArticles(phrase: string): string {
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

type Record = {
  track: number;
  title: string;
  album: string;
  artist: string;
  song: Song;
};

function compareRecord(
  comp: Sorter,
  sort: string,
  a: Record,
  b: Record,
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
      result = comp(a.album, b.album);
      break;
    case 'r':
      result = comp(a.artist, b.artist);
      break;
  }
  return sort === sort.toUpperCase() ? -result : result;
}

function selectComparator(articles: boolean, sortOrder: string) {
  const stringCompare = articles ? strCmp : theCmp;
  return (a: Record, b: Record): number => {
    for (const s of sortOrder) {
      const res = compareRecord(stringCompare, s, a, b);
      if (res !== 0) {
        return res;
      }
    }
    return 0;
  };
}

export function SortSongs(
  sortOrder: string,
  songs: Song[],
  albums: Map<AlbumKey, Album>,
  artists: Map<ArtistKey, Artist>,
  articles: boolean,
): Song[] {
  const records: Record[] = songs.map((song: Song) => ({
    song,
    ...GetDataForSong(song, albums, artists),
  }));
  return records.sort(selectComparator(articles, sortOrder)).map((r) => r.song);
}
