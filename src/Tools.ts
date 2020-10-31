// This is for getting at "global" stuff from the window object
import { FTON, FTONData, MakeLogger, Type } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-utils';
import { IpcRenderer } from 'electron';
import { IpcRendererEvent, OpenDialogSyncOptions } from 'electron/main';
import { GetDataForSong, SongData } from './DataSchema';

const log = MakeLogger('Tools', true);

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

function handleMessage(message: FTONData) {
  log('Got message:');
  log(message);
  if (Type.has(message, 'updateDatabase')) {
    // Special case this thing?
    // Everything else can just be subscribed to normally.
    // Maybe this one can to. Not sure...
  }
}

export function InitialWireUp(): void {
  if (!window.ipcSet) {
    window.ipcSet = true;

    // Set up listeners for any messages that we might want to asynchronously
    // send from the main process
    window.ipc?.on('async-data', (event: IpcRendererEvent, data: unknown) => {
      if (
        FTON.isFTON(data) &&
        Type.has(data, 'message') &&
        FTON.isFTON(data.message)
      ) {
        handleMessage(data.message);
      } else {
        log('Async message malformed:');
        log(data);
      }
    });
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

export async function SavePlaylist(
  name: string,
  songs: SongKey[],
): Promise<void> {
  await InvokeMain('set-playlist', 'thing');
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

function selectComparator(articles: boolean, sortOrder: string) {
  const stringCompare = articles ? strCmp : theCmp;
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
): Song[] {
  const records: SongData[] = songs.map((song: Song) =>
    GetDataForSong(song, albums, artists),
  );
  return records.sort(selectComparator(articles, sortOrder)).map((r) => r.song);
}

/*
 * Miscellaney
 */

export function isPlaylist(playlist: string): boolean {
  return playlist.length > 0;
}

function Rand(values: Uint32Array, max: number): number {
  return values[max - 1] % max;
}

export function ShuffleArray<T>(array: T[]): T[] {
  const values = new Uint32Array(array.length);
  window.crypto.getRandomValues(values);
  const res: T[] = [];
  const remove: T[] = [...array];
  while (remove.length > 0) {
    const i = Rand(values, remove.length);
    res.push(remove[i]);
    remove.splice(i, 1);
  }
  return res;
}

export function secondsToHMS(vals: string): string {
  const decimal = vals.indexOf('.');
  let suffix: string = decimal > 0 ? vals.substr(decimal) : '';
  suffix = suffix.replace(/0+$/g, '');
  suffix = suffix.length === 1 ? '' : suffix.substr(0, 3);
  const val = parseInt(vals, 10);
  const expr = new Date(val * 1000).toISOString();
  if (val < 600) {
    return expr.substr(15, 4) + suffix;
  } else if (val < 3600) {
    return expr.substr(14, 5) + suffix;
  } else if (val < 36000) {
    return expr.substr(12, 7) + suffix;
  } else {
    return expr.substr(11, 8) + suffix;
  }
}

function divGrand(val: string): string {
  let flt = (parseFloat(val) / 1000.0).toFixed(3);
  flt = flt.replace(/0+$/g, '');
  flt = flt.endsWith('.') ? flt.substr(0, flt.length - 1) : flt;
  return flt;
}

export function toKhz(val: string): string {
  return divGrand(val) + ' KHz';
}

export function toKbps(val: string): string {
  const str = divGrand(val);
  if (str.includes('.')) return str.substr(0, str.length - 2) + ' Kbps';
  return str + ' Kbps';
}
