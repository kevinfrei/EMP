// This is for getting at "global" stuff from the window object
import { ISearchBox } from '@fluentui/react';
import { FlatAudioDatabase } from '@freik/audiodb';
import { Helpers, MakeError, MakeLogger } from '@freik/core-utils';
import { Ipc } from '@freik/elect-render-utils';
import { AlbumKey, SongKey } from '@freik/media-core';
import { NativeImage } from 'electron';

const log = MakeLogger('MyWindow');
const err = MakeError('MyWindow-err');

/*
 * "Window" stuff goes here
 */

interface MyWindow extends Window {
  isDev: boolean;
  searchBox?: ISearchBox | null;
  db: FlatAudioDatabase;
}

declare let window: MyWindow;

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
  await Ipc.InvokeMain('upload-image', { songKey, nativeImage });
}

export async function UploadImageForAlbum(
  albumKey: AlbumKey,
  theNativeImage: NativeImage,
): Promise<void> {
  // Have to turn a nativeImage into something that can be cloned
  const nativeImage = theNativeImage.toJPEG(90);
  await Ipc.InvokeMain('upload-image', { albumKey, nativeImage });
}

// Move this shit to the main process
export async function UploadFileForSong(
  songKey: SongKey,
  path: string,
): Promise<void> {
  await Ipc.InvokeMain('upload-image-path', { songKey, path });
}

export async function UploadFileForAlbum(
  albumKey: AlbumKey,
  path: string,
): Promise<void> {
  await Ipc.InvokeMain('upload-image-path', { albumKey, path });
}
