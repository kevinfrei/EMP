// This is for getting at "global" stuff from the window object
import { ISearchBox } from '@fluentui/react';
import {
  AlbumKey,
  FTON,
  MakeError,
  MakeLogger,
  SongKey,
  Type,
} from '@freik/core-utils';
import { IpcRenderer, NativeImage } from 'electron';
import { IpcRendererEvent, OpenDialogSyncOptions } from 'electron/main';
import { PathLike } from 'fs';
import { FileHandle } from 'fs/promises';
import { HandleMessage } from './ipc';

const log = MakeLogger('MyWindow', false && IsDev());
const err = MakeError('MyWindow-err');

type ReadFile1 = (path: PathLike | FileHandle) => Promise<Buffer>;

/*
 * "Window" stuff goes here
 */

interface MyWindow extends Window {
  ipc?: IpcRenderer;
  remote?: Electron.Remote;
  isDev?: boolean;
  initApp?: () => void;
  ipcSet?: boolean;
  searchBox?: ISearchBox | null;
  clipboard: Electron.Clipboard | undefined;
  readFile: ReadFile1; // | ReadFile2 | ReadFile3;
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
export function SetSearch(searchBox: ISearchBox | null): void {
  window.searchBox = searchBox;
}
export function FocusSearch(): boolean {
  if (window.searchBox) {
    window.searchBox.focus();
    return true;
  }
  return false;
}

export function IsDev(): boolean {
  return window.isDev === true;
}

export function InitialWireUp(): void {
  if (!window.ipcSet) {
    window.ipcSet = true;

    // Set up listeners for any messages that we might want to asynchronously
    // send from the main process
    window.ipc?.on('async-data', (event: IpcRendererEvent, data: unknown) => {
      if (
        FTON.isFTON(data) &&
        Type.isArray(data) &&
        Type.isObject(data[0]) &&
        Type.has(data[0], 'message') &&
        FTON.isFTON(data[0].message)
      ) {
        log('*** Async message formed properly:');
        log(data[0]);
        HandleMessage(data[0].message);
      } else {
        err('>>> Async malformed message begin');
        err(data);
        err('<<< Async malformed message end');
      }
    });
  }
}

let mediaQuery: MediaQueryList | null = null;

// This adds a listener for a media query and invokes it the first time which
// is necessary to get it to start paying attention, apparently.
export function SubscribeMediaMatcher(
  mq: string,
  handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
): void {
  mediaQuery = window.matchMedia(mq);
  mediaQuery.addEventListener('change', handler);
  handler(mediaQuery);
}

export function UnsubscribeMediaMatcher(
  handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
): void {
  mediaQuery?.removeEventListener('change', handler);
}

export async function InvokeMain<T>(
  channel: string,
  key?: T,
): Promise<string | void> {
  let result;
  if (key) {
    log(`Invoking main("${channel}", "...")`);
    result = (await window.ipc!.invoke(channel, key)) as string;
    log(`Invoke main ("${channel}" "...") returned:`);
  } else {
    log(`Invoking main("${channel}")`);
    result = (await window.ipc!.invoke(channel)) as string;
    log(`Invoke main ("${channel}") returned:`);
  }
  log(result);
  return result;
}

export function ImageFromClipboard(): NativeImage | undefined {
  return window.clipboard?.readImage();
}

export async function UploadImageForSong(
  songKey: SongKey,
  nativeImage: NativeImage,
): Promise<void> {
  // Have to turn a nativeImage into something that can be cloned
  const buffer = nativeImage.toJPEG(90);
  await InvokeMain('upload-image', { songKey, nativeImage: buffer });
}

export async function UploadImageForAlbum(
  albumKey: AlbumKey,
  nativeImage: NativeImage,
): Promise<void> {
  // Have to turn a nativeImage into something that can be cloned
  const buffer = nativeImage.toJPEG(90);
  await InvokeMain('upload-image', { albumKey, nativeImage: buffer });
}

export async function UploadFileForSong(
  songKey: SongKey,
  path: string,
): Promise<void> {
  // Have to turn a nativeImage into something that can be cloned
  const buffer = await window.readFile(path);
  log(typeof buffer);
  await InvokeMain('upload-image', { songKey, nativeImage: buffer });
}

export async function UploadFileForAlbum(
  albumKey: AlbumKey,
  path: string,
): Promise<void> {
  // Have to turn a nativeImage into something that can be cloned
  const buffer = await window.readFile(path);
  log(typeof buffer);
  await InvokeMain('upload-image', { albumKey, nativeImage: buffer });
}
