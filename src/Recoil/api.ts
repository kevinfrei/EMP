import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import {
  isAlbumKey,
  isArtistKey,
  isSongKey,
  MediaKey,
  PlaylistName,
  SongKey,
} from '@freik/media-core';
import type { MyTransactionInterface } from '@freik/web-utils';
import { playlistNamesFunc } from './PlaylistsState';
import { albumByKeyFuncFam, artistByKeyFuncFam } from './ReadOnly';
import { activePlaylistState } from './SongPlaying';

// const { err, log } = MakeLog('EMP:render:api');

/**
 * Delete a playlist (make sure you've got the name right)
 **/
export function DeletePlaylist(
  { set, get }: MyTransactionInterface,
  toDelete: PlaylistName,
): void {
  const curNames = get(playlistNamesFunc);
  const activePlaylist = get(activePlaylistState);
  curNames.delete(toDelete);
  set(playlistNamesFunc, new Set(curNames));
  if (activePlaylist === toDelete) {
    set(activePlaylistState, '');
  }
  void Ipc.PostMain(IpcId.DeletePlaylist, toDelete);
}

export function SongListFromKey(
  { get }: MyTransactionInterface,
  data: MediaKey,
): SongKey[] {
  if (data.length === 0) {
    return [];
  }
  if (isSongKey(data)) {
    return [data];
  }
  if (isAlbumKey(data)) {
    const alb = get(albumByKeyFuncFam(data));
    return alb ? alb.songs : [];
  }
  if (isArtistKey(data)) {
    const art = get(artistByKeyFuncFam(data));
    return art ? art.songs : [];
  }
  return [];
}
