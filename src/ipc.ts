import { CallMain } from './MyWindow';

import type {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  MediaInfo,
  Song,
  SongKey,
} from './DataSchema';
import { FTON } from '@freik/core-utils';

export async function GetAllSongs(): Promise<Map<SongKey, Song> | void> {
  const blob = await CallMain<void, string>('get-all-songs');
  if (blob) {
    const data = FTON.parse(blob);
    return data as Map<SongKey, Song>;
  }
}

export async function GetAllAlbums(): Promise<Map<AlbumKey, Album> | void> {
  return await CallMain<void, Map<AlbumKey, Album>>('get-all-albums');
}

export async function GetAllArtsists(): Promise<Map<ArtistKey, Artist> | void> {
  return await CallMain<void, Map<ArtistKey, Artist>>('get-all-artists');
}

export async function GetAllPlaylists(): Promise<Map<
  string,
  SongKey[]
> | void> {
  return await CallMain<void, Map<string, SongKey[]>>('get-all-playlists');
}

export async function GetMediaInfo(key: SongKey): Promise<MediaInfo | void> {
  return await CallMain<SongKey, MediaInfo>('get-media-info', key);
}

export async function GetSongFromKey(key: SongKey): Promise<Song | void> {
  const blob = await CallMain<SongKey, string>('get-song-by-key', key);
  if (blob) {
    return FTON.parse(blob) as Song;
  }
}

export async function GetGeneral(key: string): Promise<string | void> {
  return await CallMain<string, string>('get-general', key);
}

export async function SetGeneral(key: string, data: string): Promise<void> {
  return await CallMain<string, void>('set-general', key + ':' + data);
}
