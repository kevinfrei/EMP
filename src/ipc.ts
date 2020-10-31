import { FTON, MakeLogger, Type } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-utils';
import { DefaultValue } from 'recoil';
import { InvokeMain } from './Tools';

const log = MakeLogger('ipc', true);

export type SearchResults = {
  songs: SongKey[];
  albums: AlbumKey[];
  artists: ArtistKey[];
};

export async function GetAllSongs(): Promise<Map<SongKey, Song> | void> {
  const blob = await InvokeMain('get-all-songs');
  if (blob) {
    return FTON.parse(blob) as Map<SongKey, Song>;
  }
}

export async function GetAllAlbums(): Promise<Map<AlbumKey, Album> | void> {
  const blob = await InvokeMain('get-all-albums');
  if (blob) {
    return FTON.parse(blob) as Map<AlbumKey, Album>;
  }
}

export async function GetAllArtsists(): Promise<Map<ArtistKey, Artist> | void> {
  const blob = await InvokeMain('get-all-artists');
  if (blob) {
    return FTON.parse(blob) as Map<ArtistKey, Artist>;
  }
}

export async function GetAllPlaylists(): Promise<Map<
  string,
  SongKey[]
> | void> {
  const blob = await InvokeMain('get-playlists');
  if (blob) {
    return FTON.parse(blob) as Map<string, SongKey[]>;
  }
}

export async function GetMediaInfo(
  key: SongKey,
): Promise<Map<string, string> | void> {
  const blob = await InvokeMain('get-media-info', key);
  if (blob) {
    const res = FTON.parse(blob);
    if (Type.isMapOf(res, Type.isString, Type.isString)) {
      return res;
    }
  }
}

export async function GetGeneral(key: string): Promise<string | void> {
  return await InvokeMain('get-general', key);
}
export async function GetDefaultValue(
  key: string,
): Promise<string | DefaultValue> {
  const res = await InvokeMain('get-general', key);
  return res ? res : new DefaultValue();
}

export async function SetGeneral(key: string, data: string): Promise<void> {
  await InvokeMain('set-general', key + ':' + data);
}

export async function SearchWhole(
  searchTerm: string,
): Promise<SearchResults | void> {
  log('Searching for:' + searchTerm);
  const blob = await InvokeMain('search', searchTerm);
  if (blob) {
    log('Got a blob of size: ' + blob.length.toString());
    return FTON.parse(blob) as SearchResults;
  } else {
    log('Got no blob back');
  }
}
