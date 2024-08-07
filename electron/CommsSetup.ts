import { IsOnlyMetadata } from '@freik/audiodb';
import { Comms, Shell } from '@freik/electron-main';
import { IpcId, isIgnoreItem, isXcodeInfo } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import { MediaKey } from '@freik/media-core';
import {
  chk2TupleOf,
  chkOneOf,
  isArrayOfString,
  isBoolean,
  isString,
  isUndefined,
} from '@freik/typechk';
import { Menu } from 'electron';
import {
  AddIgnoreItem,
  ClearLocalOverrides,
  FlushImageCache,
  FlushMetadataCache,
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
  clearSongHates,
  clearSongLikes,
  getSongHates,
  getSongLikes,
  setSongHates,
  setSongLikes,
} from './SongLikesAndHates';
import { getXcodeStatus, startTranscode } from './Transcoding';
import {
  GetPicDataUri,
  SaveNativeImageForAlbum,
  isAlbumCoverData,
} from './cover-art';
import {
  CheckPlaylists,
  DeletePlaylist,
  GetPlaylists,
  LoadPlaylist,
  RenamePlaylist,
  SavePlaylist,
  isPlaylistSaveData,
} from './playlists';
import {
  CloseWindow,
  MaximizeWindow,
  MinimizeWindow,
  RestoreWindow,
} from './window';

const { wrn } = MakeLog('EMP:main:Communication');

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
      await Promise.resolve();
    }
  }

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
    wrn('Sorry: Menu is falsy');
  }
  return Promise.resolve();
}

const isKeyValue = chk2TupleOf(isString, isString);

// I don't actually care about this type :)
function isVoid(obj: any): obj is void {
  return true;
}

const isStrOrUndef = chkOneOf(isUndefined, isString);

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

  Comms.registerChannel(IpcId.ShowLocFromKey, showLocFromKey, isString);
  Comms.registerChannel(IpcId.GetMediaInfo, GetMediaInfoForSong, isString);

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

  Comms.registerChannel(IpcId.FlushImageCache, FlushImageCache, isVoid);
  Comms.registerChannel(IpcId.FlushMetadataCache, FlushMetadataCache, isVoid);
  Comms.registerChannel(IpcId.ClearLocalOverrides, ClearLocalOverrides, isVoid);

  Comms.registerChannel(IpcId.Search, SearchWholeWord, isStrOrUndef);
  Comms.registerChannel(IpcId.SubstrSearch, SearchSubstring, isString);

  Comms.registerChannel(IpcId.LoadPlaylists, LoadPlaylist, isString);
  Comms.registerChannel(IpcId.GetPlaylists, GetPlaylists, isVoid);
  Comms.registerChannel(IpcId.SetPlaylists, CheckPlaylists, isArrayOfString);
  Comms.registerChannel(IpcId.RenamePlaylist, RenamePlaylist, isKeyValue);
  Comms.registerChannel(IpcId.SavePlaylist, SavePlaylist, isPlaylistSaveData);
  Comms.registerChannel(IpcId.DeletePlaylist, DeletePlaylist, isString);

  // These are implementing functionality not currently in
  // the audio-database module
  Comms.registerChannel(IpcId.GetLikes, getSongLikes, isVoid);
  Comms.registerChannel(IpcId.SetLikes, setSongLikes, isArrayOfString);
  Comms.registerChannel(IpcId.ClearLikes, clearSongLikes, isArrayOfString);

  Comms.registerChannel(IpcId.GetHates, getSongHates, isVoid);
  Comms.registerChannel(IpcId.SetHates, setSongHates, isArrayOfString);
  Comms.registerChannel(IpcId.ClearHates, clearSongHates, isArrayOfString);

  Comms.registerChannel(IpcId.ShowFile, Shell.ShowFile, isString);
  // Save-Playlist-as disabling
  Comms.registerChannel(IpcId.SetSaveMenu, setSaveMenu, isBoolean);
  // For transcoding:
  Comms.registerChannel(IpcId.TranscodingUpdate, getXcodeStatus, isVoid);
  Comms.registerChannel(IpcId.TranscodingBegin, startTranscode, isXcodeInfo);
  Comms.registerChannel(IpcId.ShowMenu, showMenu, isVoid);

  // Artwork Thumbnails:
  Comms.registerChannel(IpcId.GetPicUri, GetPicDataUri, isString);

  // Ignore list stuff:
  Comms.registerChannel(IpcId.GetIgnoreList, GetIgnoreList, isVoid);
  Comms.registerChannel(IpcId.AddIgnoreItem, AddIgnoreItem, isIgnoreItem);
  Comms.registerChannel(IpcId.RemoveIgnoreItem, RemoveIgnoreItem, isIgnoreItem);
}
