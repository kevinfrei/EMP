import { IsOnlyMetadata } from '@freik/audiodb';
import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { Comms, Persistence, Shell } from '@freik/elect-main-utils';
import { MediaKey } from '@freik/media-core';
import { ipcMain } from 'electron';
import { IpcMainInvokeEvent, Menu } from 'electron/main';
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
import { SendToMain } from './window';

const log = MakeLogger('Communication');
const err = MakeError('Communication-err');

type Handler<R, T> = (arg: T) => Promise<R | void>;

/**
 * Registers with `ipcMain.handle` a function that takes a mandatory parameter
 * and returns *string* data untouched. It also requires a checker to ensure the
 * data is properly typed
 * @param  {string} key - The id to register a listener for
 * @param  {TypeHandler<T>} handler - the function that handles the data
 * @param  {(v:any)=>v is T} checker - a Type Check function for type T
 * @returns void
 */
function registerChannel<R, T>(
  key: string,
  handler: Handler<R, T>,
  checker: (v: any) => v is T,
): void {
  ipcMain.handle(
    key,
    async (_event: IpcMainInvokeEvent, arg: any): Promise<R | void> => {
      if (checker(arg)) {
        log(`Received ${key} message: handling`);
        return await handler(arg);
      } else {
        err(`Invalid argument type to ${key} handler`);
        err(arg);
      }
    },
  );
}

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

/**
 * Send a message to the rendering process
 *
 * @param  {unknown} message
 * The (flattenable) message to send.
 */
export function AsyncSend(message: unknown): void {
  SendToMain('async-data', { message });
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
  registerChannel('get-music-database', GetSimpleMusicDatabase, isVoid);
  registerChannel('manual-rescan', RescanAudioDatase, isVoid);

  registerChannel('show-location-from-key', showLocFromKey, Type.isString);
  registerChannel('media-info', GetMediaInfoForSong, Type.isString);

  // Migrated, but not yet validated
  registerChannel('set-media-info', SetMediaInfoForSong, IsOnlyMetadata);

  // Need updated/reviewed:
  registerChannel('upload-image', SaveNativeImageForAlbum, isAlbumCoverData);
  // TODO:
  // registerChannel('flush-image-cache', FlushImageCache, isVoid);

  registerChannel('search', SearchWholeWord, isStrOrUndef);
  registerChannel('subsearch', SearchSubstring, Type.isString);

  registerChannel('load-playlist', LoadPlaylist, Type.isString);
  registerChannel('get-playlists', GetPlaylists, isVoid);
  registerChannel('set-playlists', CheckPlaylists, Type.isArrayOfString);
  registerChannel('rename-playlist', RenamePlaylist, isKeyValue);
  registerChannel('save-playlist', SavePlaylist, isPlaylistSaveData);
  registerChannel('delete-playlist', DeletePlaylist, Type.isString);

  // These are implementing functionality not currently in
  // the audio-database module
  registerChannel('get-likes', getSongLikes, isVoid);
  registerChannel('set-likes', setSongLikes, Type.isArrayOfString);
  registerChannel('clear-likes', clearSongLikes, Type.isArrayOfString);

  registerChannel('get-hates', getSongHates, isVoid);
  registerChannel('set-hates', setSongHates, Type.isArrayOfString);
  registerChannel('clear-hates', clearSongHates, Type.isArrayOfString);

  registerChannel('show-file', Shell.showFile, Type.isString);
  // Save-Playlist-as disabling
  registerChannel('set-save-menu', setSaveMenu, Type.isBoolean);
}
