// This is for getting at "global" stuff from the window object
import { ISearchBox } from '@fluentui/react';
import { FlatAudioDatabase } from '@freik/audiodb';
import { MakeLogger } from '@freik/core-utils';
import { ElectronWindow, Ipc } from '@freik/elect-render-utils';
import { AlbumKey, SongKey } from '@freik/media-core';
import { NativeImage } from 'electron';
import { IpcId } from 'shared';

const log = MakeLogger('MyWindow-logger');

/*
 * "Window" stuff goes here
 */

interface MyWindow extends ElectronWindow {
  searchBox?: ISearchBox | null;
  db: FlatAudioDatabase;
}

declare let window: MyWindow;

export function isHostMac(): boolean {
  return window.electronConnector?.hostOs === 'mac';
}

export function isHostLinux(): boolean {
  return window.electronConnector?.hostOs === 'lin';
}

export function isHostWindows(): boolean {
  return window.electronConnector?.hostOs === 'win';
}

// This is mostly just used for debugging...
export function SetDB(db: FlatAudioDatabase): void {
  /*
  const albums = db.albums.sort((a, b) =>
    Helpers.NormalizedStringCompare(a.title, b.title),
  );
  const artists = db.artists.sort((a, b) =>
    Helpers.NormalizedStringCompare(a.name, b.name),
  );
  const songs = db.songs.sort((a, b) =>
    Helpers.NormalizedStringCompare(a.title, b.title),
  );
  */
  log('Database set on window object');
  window.db = {
    albums: db.albums,
    artists: db.artists,
    songs: db.songs,
  } as FlatAudioDatabase;
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

export async function UploadImageForSong(
  songKey: SongKey,
  theNativeImage: NativeImage,
): Promise<void> {
  // Have to turn a nativeImage into something that can be cloned
  const nativeImage = theNativeImage.toJPEG(90);
  await Ipc.InvokeMain(IpcId.UploadImage, { songKey, nativeImage });
}

export async function UploadImageForAlbum(
  albumKey: AlbumKey,
  theNativeImage: NativeImage,
): Promise<void> {
  // Have to turn a nativeImage into something that can be cloned
  const nativeImage = theNativeImage.toJPEG(90);
  await Ipc.InvokeMain(IpcId.UploadImage, { albumKey, nativeImage });
}

export async function UploadFileForSong(
  songKey: SongKey,
  imagePath: string,
): Promise<void> {
  await Ipc.InvokeMain(IpcId.UploadImage, { songKey, imagePath });
}

export async function UploadFileForAlbum(
  albumKey: AlbumKey,
  imagePath: string,
): Promise<void> {
  await Ipc.InvokeMain(IpcId.UploadImage, { albumKey, imagePath });
}
