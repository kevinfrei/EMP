import { Ipc } from '@freik/electron-render';
import { MakeLog } from '@freik/logger';
import {
  AlbumKey,
  ArtistKey,
  FullMetadata,
  MediaKey,
  SongKey,
} from '@freik/media-core';
import {
  chkObjectOfType,
  chkOneOf,
  isArrayOfString,
  isMapOfStrings,
  isString,
  isUndefined,
} from '@freik/typechk';
import { IgnoreItem, IpcId } from '@freik/emp-shared';

const { log, wrn } = MakeLog('EMP:render:ipc');

export type SearchResults = {
  songs: SongKey[];
  albums: AlbumKey[];
  artists: ArtistKey[];
};

export async function GetMediaInfo(
  key: SongKey,
): Promise<Map<string, string> | void> {
  return Ipc.CallMain<Map<string, string>, string>(
    IpcId.GetMediaInfo,
    key,
    isMapOfStrings,
  );
}

export async function GetPicDataUri(key: MediaKey): Promise<string | void> {
  const res = Ipc.CallMain<string, MediaKey>(IpcId.GetPicUri, key, isString);
  log(res);
  return res;
}

export async function SetMediaInfo(md: Partial<FullMetadata>): Promise<void> {
  return Ipc.PostMain(IpcId.SetMediaInfo, md);
}

const isSearchResults = chkOneOf(
  isUndefined,
  chkObjectOfType<SearchResults>({
    songs: isArrayOfString,
    albums: isArrayOfString,
    artists: isArrayOfString,
  }),
);

export async function SearchWhole(
  searchTerm: string,
): Promise<SearchResults | void> {
  log('Searching for:' + searchTerm);
  const res = await Ipc.CallMain(IpcId.Search, searchTerm, isSearchResults);
  if (res) {
    log('Got a search results blob:');
    log(res);
    return res;
  } else {
    log('Got no search results back');
  }
}

export function AddIgnoreItem(item: IgnoreItem): void {
  Ipc.PostMain(IpcId.AddIgnoreItem, item).catch(wrn);
}

export function RemoveIgnoreItem(item: IgnoreItem): void {
  Ipc.PostMain(IpcId.RemoveIgnoreItem, item).catch(wrn);
}
