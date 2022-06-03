// This is for getting at "global" stuff from the window object
import { ISearchBox } from '@fluentui/react';
import { FlatAudioDatabase } from '@freik/audiodb';
import { Helpers } from '@freik/core-utils';
import { Ipc } from '@freik/elect-render-utils';
import { AlbumKey, SongKey } from '@freik/media-core';
import { NativeImage } from 'electron';
import { IpcId } from 'shared';

/*
 * "Window" stuff goes here
 */

interface MyWindow extends Window {
  searchBox?: ISearchBox | null;
  db: FlatAudioDatabase;
  // This is set up by the @freik/electron-renderer package
  freik?: { hostOs?: 'darwin' | 'win32' | 'linux' };
}

declare let window: MyWindow;

export function isHostMac(): boolean {
  return window.freik ? window.freik.hostOs === 'darwin' : false;
}

export function isHostLinux(): boolean {
  return window.freik ? window.freik.hostOs === 'linux' : false;
}

export function isHostWindows(): boolean {
  return window.freik ? window.freik.hostOs === 'win32' : false;
}

export function SetDB(db: FlatAudioDatabase): void {
  const albums = db.albums.sort((a, b) =>
    Helpers.NormalizedStringCompare(a.title, b.title),
  );
  const artists = db.artists.sort((a, b) =>
    Helpers.NormalizedStringCompare(a.name, b.name),
  );
  const songs = db.songs.sort((a, b) =>
    Helpers.NormalizedStringCompare(a.title, b.title),
  );
  window.db = { albums, artists, songs };
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
