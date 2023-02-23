import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { Ipc } from '@freik/elect-render-utils';
import {
  AlbumKey,
  ArtistKey,
  FullMetadata,
  MediaKey,
  SongKey,
} from '@freik/media-core';
import { IgnoreItem, IpcId } from 'shared';

const log = MakeLogger('ipc');
const err = MakeError('ipc-error');

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
    Type.isMapOfStrings,
  );
}

export async function GetPicDataUri(key: MediaKey): Promise<string | void> {
  const res = Ipc.CallMain<string, MediaKey>(
    IpcId.GetPicUri,
    key,
    Type.isString,
  );
  log(res);
  return res;
}

export async function SetMediaInfo(md: Partial<FullMetadata>): Promise<void> {
  return Ipc.PostMain(IpcId.SetMediaInfo, md);
}

const isSearchResults = Type.isOneOfFn(
  Type.isUndefined,
  Type.isSpecificTypeFn<SearchResults>(
    [
      ['songs', Type.isArrayOfString],
      ['albums', Type.isArrayOfString],
      ['artists', Type.isArrayOfString],
    ],
    ['songs', 'albums', 'artists'],
  ),
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
  Ipc.PostMain(IpcId.AddIgnoreItem, item).catch(err);
}

export function RemoveIgnoreItem(item: IgnoreItem): void {
  Ipc.PostMain(IpcId.RemoveIgnoreItem, item).catch(err);
}
