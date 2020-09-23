import { InvokeMain } from './Tools';

import type {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  MediaInfo,
  Song,
  SongKey,
} from '@freik/media-utils';
import { FTON } from '@freik/core-utils';

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

export async function GetMediaInfo(key: SongKey): Promise<MediaInfo | void> {
  const blob = await InvokeMain('get-media-info', key);
  if (blob) {
    return FTON.parse(blob) as MediaInfo;
  }
}

export async function GetGeneral(key: string): Promise<string | void> {
  return await InvokeMain('get-general', key);
}

export async function SetGeneral(key: string, data: string): Promise<void> {
  await InvokeMain('set-general', key + ':' + data);
}
