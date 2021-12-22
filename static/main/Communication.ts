import { IsOnlyMetadata } from '@freik/audiodb';
import { Type } from '@freik/core-utils';
import { Comms, Persistence, Shell } from '@freik/elect-main-utils';
import { MediaKey } from '@freik/media-core';
import { Menu } from 'electron/main';
import {
  GetMediaInfoForSong,
  GetPathFromKey,
  GetSimpleMusicDatabase,
  RescanAudioDatase,
  SearchSubstring,
  SearchWholeWord,
  SetMediaInfoForSong,
} from './AudioDatabase';
import { isAlbumCoverData, SaveNativeImageForAlbum } from './cover-art';
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

/**
 * Show a file in the shell
 * @param filePath - The path to the file to show
 */
async function showLocFromKey(mediaKey?: MediaKey): Promise<void> {
  const thePath = await GetPathFromKey(mediaKey);
  if (thePath) {
    return Shell.showFile(thePath);
  }
}

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

function isKeyValue(obj: any): obj is [string, string] {
  return Type.is2TupleOf(obj, Type.isString, Type.isString);
}

// I don't actually care about this type :)
function isVoid(obj: any): obj is void {
  return true;
}

function isStrOrUndef(obj: any): obj is string | undefined {
  return Type.isString(obj) || obj === undefined;
}

/**
 * Setup any async listeners, plus register all the "invoke" handlers
 */
export function CommsSetup(): void {
  // These are the general "just asking for something to read/written to disk"
  // functions. Media Info, Search, and MusicDB stuff needs a different handler
  // because they don't just read/write to disk.
  Comms.SetupDefault();

  // "complex" API's (not just save/restore data to the persist cache)

  // Migrated to new audio-database module:
  Comms.registerChannel('get-music-database', GetSimpleMusicDatabase, isVoid);
  Comms.registerChannel('manual-rescan', RescanAudioDatase, isVoid);

  Comms.registerChannel(
    'show-location-from-key',
    showLocFromKey,
    Type.isString,
  );
  Comms.registerChannel('media-info', GetMediaInfoForSong, Type.isString);

  // Migrated, but not yet validated
  Comms.registerChannel('set-media-info', SetMediaInfoForSong, IsOnlyMetadata);

  // Need updated/reviewed:
  Comms.registerChannel(
    'upload-image',
    SaveNativeImageForAlbum,
    isAlbumCoverData,
  );
  // TODO:
  // Comms.registerChannel('flush-image-cache', FlushImageCache, isVoid);

  Comms.registerChannel('search', SearchWholeWord, isStrOrUndef);
  Comms.registerChannel('subsearch', SearchSubstring, Type.isString);

  Comms.registerChannel('load-playlist', LoadPlaylist, Type.isString);
  Comms.registerChannel('get-playlists', GetPlaylists, isVoid);
  Comms.registerChannel('set-playlists', CheckPlaylists, Type.isArrayOfString);
  Comms.registerChannel('rename-playlist', RenamePlaylist, isKeyValue);
  Comms.registerChannel('save-playlist', SavePlaylist, isPlaylistSaveData);
  Comms.registerChannel('delete-playlist', DeletePlaylist, Type.isString);

  // These are implementing functionality not currently in
  // the audio-database module
  Comms.registerChannel('get-likes', getSongLikes, isVoid);
  Comms.registerChannel('set-likes', setSongLikes, Type.isArrayOfString);
  Comms.registerChannel('clear-likes', clearSongLikes, Type.isArrayOfString);

  Comms.registerChannel('get-hates', getSongHates, isVoid);
  Comms.registerChannel('set-hates', setSongHates, Type.isArrayOfString);
  Comms.registerChannel('clear-hates', clearSongHates, Type.isArrayOfString);

  Comms.registerChannel('show-file', Shell.showFile, Type.isString);
  // Save-Playlist-as disabling
  Comms.registerChannel('set-save-menu', setSaveMenu, Type.isBoolean);
}
