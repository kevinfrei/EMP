import { MakeError, MakeLogger, Type } from '@freik/core-utils';
import { Ipc } from '@freik/elect-render-utils';
import { AlbumKey, ArtistKey, FullMetadata, SongKey } from '@freik/media-core';

const log = MakeLogger('ipc');
const err = MakeError('ipc-err');

export type SearchResults = {
  songs: SongKey[];
  albums: AlbumKey[];
  artists: ArtistKey[];
};

export async function GetMediaInfo(
  key: SongKey,
): Promise<Map<string, string> | void> {
  return Ipc.CallMain<Map<string, string>, string>(
    'media-info',
    key,
    Type.isMapOfStrings,
  );
}

export async function SetMediaInfo(md: Partial<FullMetadata>): Promise<void> {
  await Ipc.PostMain('set-media-info', md);
}
/*
export async function ReadFromStorage(key: string): Promise<string | void> {
  return Ipc.CallMain('read-from-storage', key, Type.isString);
}

export async function WriteToStorage(key: string, data: string): Promise<void> {
  await Ipc.InvokeMain('write-to-storage', [key, data]);
}
*/

function isSearchResults(arg: any): arg is SearchResults | undefined {
  if (
    Type.isObjectNonNull(arg) &&
    Type.has(arg, 'songs') &&
    Type.has(arg, 'albums') &&
    Type.has(arg, 'artists')
  ) {
    return (
      Type.isArrayOfString(arg.albums) &&
      Type.isArrayOfString(arg.artists) &&
      Type.isArrayOfString(arg.songs)
    );
  }
  return arg === undefined;
}

export async function SearchWhole(
  searchTerm: string,
): Promise<SearchResults | void> {
  log('Searching for:' + searchTerm);
  const res = await Ipc.CallMain('search', searchTerm, isSearchResults);
  if (res) {
    log('Got a search results blob:');
    log(res);
    return res;
  } else {
    log('Got no search results back');
  }
}
