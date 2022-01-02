import { MakeLogger, Type } from '@freik/core-utils';
import { Ipc } from '@freik/elect-render-utils';
import { AlbumKey, ArtistKey, FullMetadata, SongKey } from '@freik/media-core';
import { IpcId } from 'shared';

const log = MakeLogger('ipc');

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

export async function SetMediaInfo(md: Partial<FullMetadata>): Promise<void> {
  return Ipc.PostMain(IpcId.SetMediaInfo, md);
}

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
  const res = await Ipc.CallMain(IpcId.Search, searchTerm, isSearchResults);
  if (res) {
    log('Got a search results blob:');
    log(res);
    return res;
  } else {
    log('Got no search results back');
  }
}
