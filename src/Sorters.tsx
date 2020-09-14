import { Comparisons } from '@freik/core-utils';
import ShuffleArray from './ShuffleArray';

import type {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from './MyStore';
import { GetDataForSong } from './DataAccess';

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
/*
export const SongBy = {
  ArtistAlbumNumberTitle: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: SongKey, b: SongKey) => {
      const {
        title: aTitle,
        track: aTrack,
        album: aAlbum,
        artist: aArtist,
      } = GetDataForSong(store, a);
      const {
        title: bTitle,
        track: bTrack,
        album: bAlbum,
        artist: bArtist,
      } = GetDataForSong(store, b);
      return (
        cmp(aArtist, bArtist) ||
        cmp(aAlbum, bAlbum) ||
        aTrack - bTrack ||
        cmp(aTitle, bTitle)
      );
    };
  },
  AlbumAristNumberTitle: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: SongKey, b: SongKey) => {
      const {
        title: aTitle,
        track: aTrack,
        album: aAlbum,
        artist: aArtist,
      } = GetDataForSong(store, a);
      const {
        title: bTitle,
        track: bTrack,
        album: bAlbum,
        artist: bArtist,
      } = GetDataForSong(store, b);
      return (
        cmp(aAlbum, bAlbum) ||
        cmp(aArtist, bArtist) ||
        aTrack - bTrack ||
        cmp(aTitle, bTitle)
      );
    };
  },
  NumberAlbumArtistTitle: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: SongKey, b: SongKey) => {
      const {
        title: aTitle,
        track: aTrack,
        album: aAlbum,
        artist: aArtist,
      } = GetDataForSong(store, a);
      const {
        title: bTitle,
        track: bTrack,
        album: bAlbum,
        artist: bArtist,
      } = GetDataForSong(store, b);
      return (
        aTrack - bTrack ||
        cmp(aAlbum, bAlbum) ||
        cmp(aArtist, bArtist) ||
        cmp(aTitle, bTitle)
      );
    };
  },
  TitleAlbumAristNumber: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: SongKey, b: SongKey) => {
      const {
        title: aTitle,
        track: aTrack,
        album: aAlbum,
        artist: aArtist,
      } = GetDataForSong(store, a);
      const {
        title: bTitle,
        track: bTrack,
        album: bAlbum,
        artist: bArtist,
      } = GetDataForSong(store, b);
      return (
        cmp(aTitle, bTitle) ||
        cmp(aAlbum, bAlbum) ||
        cmp(aArtist, bArtist) ||
        aTrack - bTrack
      );
    };
  },
};

const SortSongBy = {
  ArtistAlbumNumberTitle: (
    get: GetRecoilValue,
    withArticles: boolean,
  ): sorter => {
    const cmp = withArticles ? strCmp : theCmp;
    return (a: SongKey, b: SongKey) => {
      const {
        title: aTitle,
        track: aTrack,
        album: aAlbum,
        artist: aArtist,
      } = RecoilDataForSong(get, a);
      const {
        title: bTitle,
        track: bTrack,
        album: bAlbum,
        artist: bArtist,
      } = RecoilDataForSong(get, b);
      return (
        cmp(aArtist, bArtist) ||
        cmp(aAlbum, bAlbum) ||
        aTrack - bTrack ||
        cmp(aTitle, bTitle)
      );
    };
  },
  AlbumAristNumberTitle: (
    get: GetRecoilValue,
    withArticles: boolean,
  ): sorter => {
    const cmp = withArticles ? strCmp : theCmp;
    return (a: SongKey, b: SongKey) => {
      const {
        title: aTitle,
        track: aTrack,
        album: aAlbum,
        artist: aArtist,
      } = RecoilDataForSong(get, a);
      const {
        title: bTitle,
        track: bTrack,
        album: bAlbum,
        artist: bArtist,
      } = RecoilDataForSong(get, b);
      return (
        cmp(aAlbum, bAlbum) ||
        cmp(aArtist, bArtist) ||
        aTrack - bTrack ||
        cmp(aTitle, bTitle)
      );
    };
  },
  NumberAlbumArtistTitle: (
    get: GetRecoilValue,
    withArticles: boolean,
  ): sorter => {
    const cmp = withArticles ? strCmp : theCmp;
    return (a: SongKey, b: SongKey) => {
      const {
        title: aTitle,
        track: aTrack,
        album: aAlbum,
        artist: aArtist,
      } = RecoilDataForSong(get, a);
      const {
        title: bTitle,
        track: bTrack,
        album: bAlbum,
        artist: bArtist,
      } = RecoilDataForSong(get, b);
      return (
        aTrack - bTrack ||
        cmp(aAlbum, bAlbum) ||
        cmp(aArtist, bArtist) ||
        cmp(aTitle, bTitle)
      );
    };
  },
  TitleAlbumAristNumber: (
    get: GetRecoilValue,
    withArticles: boolean,
  ): sorter => {
    const cmp = withArticles ? strCmp : theCmp;
    return (a: SongKey, b: SongKey) => {
      const {
        title: aTitle,
        track: aTrack,
        album: aAlbum,
        artist: aArtist,
      } = RecoilDataForSong(get, a);
      const {
        title: bTitle,
        track: bTrack,
        album: bAlbum,
        artist: bArtist,
      } = RecoilDataForSong(get, b);
      return (
        cmp(aTitle, bTitle) ||
        cmp(aAlbum, bAlbum) ||
        cmp(aArtist, bArtist) ||
        aTrack - bTrack
      );
    };
  },
};

export function GetSongSorter(
  get: GetRecoilValue,
  songSort: string,
  withArticles: boolean,
): sorter {
  switch (songSort) {
    case 'SongTitle':
      return SortSongBy.TitleAlbumAristNumber(get, withArticles);
    case 'AlbumTrack':
      return SortSongBy.AlbumAristNumberTitle(get, withArticles);
    case 'ArtistAlbum':
    default:
      return SortSongBy.ArtistAlbumNumberTitle(get, withArticles);
  }
}
export const AlbumBy = {
  TitleArtistYear: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: AlbumKey, b: AlbumKey) => {
      const { title: aTitle, artist: aArtist } = GetDataForAlbum(store, a);
      const { title: bTitle, artist: bArtist } = GetDataForAlbum(store, b);
      return cmp(aTitle, bTitle) || cmp(aArtist, bArtist);
    };
  },
  TitleYear: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: AlbumKey, b: AlbumKey) => {
      const { title: aTitle, year: aYear, artist: aArtist } = GetDataForAlbum(
        store,
        a,
      );
      const { title: bTitle, year: bYear, artist: bArtist } = GetDataForAlbum(
        store,
        b,
      );
      return cmp(aTitle, bTitle) || aYear - bYear || cmp(aArtist, bArtist);
    };
  },
  ArtistTitle: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: AlbumKey, b: AlbumKey) => {
      const { title: aTitle, artist: aArtist, year: aYear } = GetDataForAlbum(
        store,
        a,
      );
      const { title: bTitle, artist: bArtist, year: bYear } = GetDataForAlbum(
        store,
        b,
      );
      return cmp(aTitle, bTitle) || cmp(aArtist, bArtist) || aYear - bYear;
    };
  },
  ArtistYear: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: AlbumKey, b: AlbumKey) => {
      const { title: aTitle, artist: aArtist, year: aYear } = GetDataForAlbum(
        store,
        a,
      );
      const { title: bTitle, artist: bArtist, year: bYear } = GetDataForAlbum(
        store,
        b,
      );
      return cmp(aArtist, bArtist) || aYear - bYear || cmp(aTitle, bTitle);
    };
  },
};

export const ArtistBy = {
  Name: (store: StoreState): sorter => {
    const cmp = store.get('SortWithArticles') ? strCmp : theCmp;
    return (a: ArtistKey, b: ArtistKey) => {
      const artists = store.get('Artists');
      const aArt = artists.get(a);
      const bArt = artists.get(b);
      if (!aArt) {
        return bArt ? -1 : 0;
      } else if (!bArt) {
        return 1;
      }
      return cmp(aArt.name, bArt.name);
    };
  },
  AlbumCount: (store: StoreState): sorter => {
    return (a: ArtistKey, b: ArtistKey) => {
      const artists = store.get('Artists');
      const aArt = artists.get(a);
      const bArt = artists.get(b);
      if (!aArt) {
        return bArt ? -1 : 0;
      } else if (!bArt) {
        return 1;
      }
      return bArt.albums.length - aArt.albums.length;
    };
  },
  SongCount: (store: StoreState): sorter => {
    return (a: ArtistKey, b: ArtistKey) => {
      const artists = store.get('Artists');
      const aArt = artists.get(a);
      const bArt = artists.get(b);
      if (!aArt) {
        return bArt ? -1 : 0;
      } else if (!bArt) {
        return 1;
      }
      return bArt.songs.length - aArt.songs.length;
    };
  },
};

export function PlaysetsComp(
  ps1: Map<string, SongKey[]>,
  ps2: Map<string, SongKey[]>,
): boolean {
  if (ps1.size !== ps2.size) {
    return false;
  }
  for (const [k, v] of ps1) {
    const v2 = ps2.get(k);
    if (!Comparisons.ArraySetEqual(v, v2)) {
      return false;
    }
  }
  return true;
}

function sortAndStore<V>(
  store: StoreState,
  map: Map<string, V>,
  name: ArrayOfKeys,
  srt: (k1: string, K2: string) => number,
) {
  const keys: string[] = [...map.keys()];
  keys.sort(srt);
  store.set(name)(keys);
}

export function SortAlbums(store: StoreState): void {
  const map = store.get('Albums');
  const whichSort = store.get('AlbumListSort');
  let srt: sorter;
  switch (whichSort) {
    default:
    case 'AlbumTitle':
      srt = AlbumBy.TitleArtistYear(store);
      break;
    case 'AlbumYear':
      srt = AlbumBy.TitleYear(store);
      break;
    case 'ArtistAlbum':
      srt = AlbumBy.ArtistTitle(store);
      break;
    case 'ArtistYear':
      srt = AlbumBy.ArtistYear(store);
      break;
  }
  sortAndStore(store, map, 'AlbumArray', srt);
}

export function SortArtists(store: StoreState): void {
  const map = store.get('Artists');
  const whichSort = store.get('ArtistListSort');
  let srt: sorter;
  switch (whichSort) {
    default:
    case 'ArtistName':
      srt = ArtistBy.Name(store);
      break;
    case 'AlbumCount':
      srt = ArtistBy.AlbumCount(store);
      break;
    case 'SongCount':
      srt = ArtistBy.SongCount(store);
      break;
  }
  sortAndStore(store, map, 'ArtistArray', srt);
}

export function SortSomeSongs(store: StoreState): void {
  const map = store.get('Songs');
  const whichSort = store.get('SongListSort');
  let srt: sorter;
  switch (whichSort) {
    default:
    case 'ArtistAlbum':
      srt = SongBy.ArtistAlbumNumberTitle(store);
      break;
    case 'SongTitle':
      srt = SongBy.TitleAlbumAristNumber(store);
      break;
    case 'AlbumTrack':
      srt = SongBy.AlbumAristNumberTitle(store);
      break;
  }
  sortAndStore(store, map, 'SongArray', srt);
}
*/

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
