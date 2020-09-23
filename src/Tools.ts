// This is for getting at "global" stuff from the window object
import { Logger } from '@freik/core-utils';
import { Album, AlbumKey, Artist, ArtistKey, Song } from '@freik/media-utils';
import { IpcRenderer } from 'electron';
import { OpenDialogSyncOptions } from 'electron/main';
import { GetDataForSong } from './DataSchema';

const log = Logger.bind('Tools');
// Logger.enable('Tools');

/*
 * "Window" stuff goes here
 */

interface MyWindow extends Window {
  ipc: IpcRenderer | undefined;
  remote: Electron.Remote | undefined;
  isDev: boolean | undefined;
  initApp: undefined | (() => void);
  ipcSet: boolean | undefined;
}

declare let window: MyWindow;

export function ShowOpenDialog(
  options: OpenDialogSyncOptions,
): string[] | undefined {
  return window.remote!.dialog.showOpenDialogSync(options);
}

export function SetInit(func: () => void): void {
  window.initApp = func;
}

export function InitialWireUp(): void {
  if (!window.ipcSet) {
    window.ipcSet = true;
    // Nothing to do here, actually
  }
}

export async function InvokeMain(
  channel: string,
  key?: string,
): Promise<string | void> {
  let result;
  if (key) {
    log(`Invoking main("${channel}", "${key}")`);
    result = (await window.ipc!.invoke(channel, key)) as string;
    log(`Invoke main ("${channel}" "${key}") returned:`);
  } else {
    log(`Invoking main("${channel}")`);
    result = (await window.ipc!.invoke(channel)) as string;
    log(`Invoke main ("${channel}") returned:`);
  }
  log(result);
  return result;
}

/*
 * Sorting
 */

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
): Song[] {
  const records: Record[] = songs.map((song: Song) => ({
    song,
    ...GetDataForSong(song, albums, artists),
  }));
  return records.sort(selectComparator(articles, sortOrder)).map((r) => r.song);
}

/*
 * Miscellaney
 */

export function isPlaylist(playlist: string): boolean {
  return playlist.length > 0;
}

function Rand(max: number): number {
  return Math.floor(Math.random() * max);
}

export function ShuffleArray<T>(array: T[]): T[] {
  const res: T[] = [];
  const remove: T[] = [...array];
  while (remove.length > 0) {
    const i = Rand(remove.length);
    res.push(remove[i]);
    remove.splice(i, 1);
  }
  return res;
}
