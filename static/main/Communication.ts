import { IsOnlyMetadata } from '@freik/audiodb';
import { MakeError, Type } from '@freik/core-utils';
import { Comms, Persistence, Shell } from '@freik/elect-main-utils';
import { MediaKey } from '@freik/media-core';
import { Menu } from 'electron/main';
import { IpcId, isIgnoreItemFn, isXcodeInfo } from 'shared';
import {
  AddIgnoreItem,
  GetIgnoreList,
  GetMediaInfoForSong,
  GetPathFromKey,
  GetSimpleMusicDatabase,
  RemoveIgnoreItem,
  RescanAudioDatase,
  SearchSubstring,
  SearchWholeWord,
  SetMediaInfoForSong,
} from './AudioDatabase';
import {
  GetPicDataUri,
  isAlbumCoverData,
  SaveNativeImageForAlbum,
} from './cover-art';
import {
  CheckPlaylists,
  DeletePlaylist,
  GetPlaylists,
  isPlaylistSaveData,
  LoadPlaylist,
  RenamePlaylist,
  SavePlaylist,
} from './playlists';
import {
  clearSongHates,
  clearSongLikes,
  getSongHates,
  getSongLikes,
  setSongHates,
  setSongLikes,
} from './SongLikesAndHates';
import { getXcodeStatus, startTranscode } from './Transcoding';
import {
  CloseWindow,
  MaximizeWindow,
  MinimizeWindow,
  RestoreWindow,
} from './window';

const err = MakeError('Communication');

/**
 * Show a file in the shell
 * @param filePath - The path to the file to show
 */
async function showLocFromKey(mediaKey?: MediaKey): Promise<void> {
  const thePath = await GetPathFromKey(mediaKey);
  if (thePath) {
    return Shell.ShowFile(thePath);
  }
}

/**
 * Enables or disables the "Save Playlist" button (used to reflect whether the
 * playlist has been modified)
 */
async function setSaveMenu(enabled: boolean): Promise<void> {
  const menu = Menu.getApplicationMenu();
  if (menu) {
    const item = menu.getMenuItemById('save playlist');
    if (item) {
      item.enabled = enabled;
    } else {
      await Persistence.getItemAsync('nothing');
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return;
}

/**
 * Pops up the menu (for Windows/Linus cuz they don't have menu bars always
 * burning screen space)
 */
async function showMenu(): Promise<void> {
  const menu = Menu.getApplicationMenu();
  if (menu) {
    menu.popup();
  } else {
    err('Sorry: Menu is falsy');
  }
  return Promise.resolve();
}

const isKeyValue = Type.is2TypeOfFn(Type.isString, Type.isString);

// I don't actually care about this type :)
function isVoid(obj: any): obj is void {
  return true;
}

const isStrOrUndef = Type.isOneOfFn(Type.isUndefined, Type.isString);

/**
 * Setup any async listeners, plus register all the "invoke" handlers
 */
export function CommsSetup(): void {
  // These are the general "just asking for something to read/written to disk"
  // functions. Media Info, Search, and MusicDB stuff needs a different handler
  // because they don't just read/write to disk.
  Comms.SetupDefault();

  Comms.registerChannel(IpcId.CloseWindow, CloseWindow, isVoid);
  Comms.registerChannel(IpcId.MinimizeWindow, MinimizeWindow, isVoid);
  Comms.registerChannel(IpcId.RestoreWindow, RestoreWindow, isVoid);
  Comms.registerChannel(IpcId.MaximizeWindow, MaximizeWindow, isVoid);

  // "complex" API's (not just save/restore data to the persist cache)

  // Migrated to new audio-database module:
  Comms.registerChannel(IpcId.GetMusicDatabase, GetSimpleMusicDatabase, isVoid);
  Comms.registerChannel(IpcId.ManualRescan, RescanAudioDatase, isVoid);

  Comms.registerChannel(IpcId.ShowLocFromKey, showLocFromKey, Type.isString);
  Comms.registerChannel(IpcId.GetMediaInfo, GetMediaInfoForSong, Type.isString);

  // Migrated, but not yet validated
  Comms.registerChannel(
    IpcId.SetMediaInfo,
    SetMediaInfoForSong,
    IsOnlyMetadata,
  );

  Comms.registerChannel(
    IpcId.UploadImage,
    SaveNativeImageForAlbum,
    isAlbumCoverData,
  );

  // Comms.registerChannel('flush-image-cache', FlushImageCache, isVoid);

  Comms.registerChannel(IpcId.Search, SearchWholeWord, isStrOrUndef);
  Comms.registerChannel(IpcId.SubstrSearch, SearchSubstring, Type.isString);

  Comms.registerChannel(IpcId.LoadPlaylists, LoadPlaylist, Type.isString);
  Comms.registerChannel(IpcId.GetPlaylists, GetPlaylists, isVoid);
  Comms.registerChannel(
    IpcId.SetPlaylists,
    CheckPlaylists,
    Type.isArrayOfString,
  );
  Comms.registerChannel(IpcId.RenamePlaylist, RenamePlaylist, isKeyValue);
  Comms.registerChannel(IpcId.SavePlaylist, SavePlaylist, isPlaylistSaveData);
  Comms.registerChannel(IpcId.DeletePlaylist, DeletePlaylist, Type.isString);

  // These are implementing functionality not currently in
  // the audio-database module
  Comms.registerChannel(IpcId.GetLikes, getSongLikes, isVoid);
  Comms.registerChannel(IpcId.SetLikes, setSongLikes, Type.isArrayOfString);
  Comms.registerChannel(IpcId.ClearLikes, clearSongLikes, Type.isArrayOfString);

  Comms.registerChannel(IpcId.GetHates, getSongHates, isVoid);
  Comms.registerChannel(IpcId.SetHates, setSongHates, Type.isArrayOfString);
  Comms.registerChannel(IpcId.ClearHates, clearSongHates, Type.isArrayOfString);

  Comms.registerChannel(IpcId.ShowFile, Shell.ShowFile, Type.isString);
  // Save-Playlist-as disabling
  Comms.registerChannel(IpcId.SetSaveMenu, setSaveMenu, Type.isBoolean);
  // For transcoding:
  Comms.registerChannel(IpcId.TranscodingUpdate, getXcodeStatus, isVoid);
  Comms.registerChannel(IpcId.TranscodingBegin, startTranscode, isXcodeInfo);
  Comms.registerChannel(IpcId.ShowMenu, showMenu, isVoid);

  // Artwork Thumbnails:
  Comms.registerChannel(IpcId.GetPicUri, GetPicDataUri, Type.isString);

  // Ignore list stuff:
  Comms.registerChannel(IpcId.GetIgnoreList, GetIgnoreList, isVoid);
  Comms.registerChannel(IpcId.AddIgnoreItem, AddIgnoreItem, isIgnoreItemFn);
  Comms.registerChannel(
    IpcId.RemoveIgnoreItem,
    RemoveIgnoreItem,
    isIgnoreItemFn,
  );
}
