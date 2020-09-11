import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  MediaInfo,
  Song,
  SongKey,
} from './MyStore';
import { CallMain } from './MyWindow';

export async function GetAllSongs(): Promise<Map<SongKey, Song> | void> {
  return await CallMain<void, Map<SongKey, Song>>('get-all-songs');
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
