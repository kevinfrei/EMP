/* eslint-disable @typescript-eslint/naming-convention */
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  MakeLogger,
  Song,
  SongKey,
} from '@freik/core-utils';
import { atom, RecoilValue, selector, selectorFamily } from 'recoil';
import * as ipc from '../ipc';
import { syncWithMainEffect } from './helpers';
import { songListState } from './Local';

export type GetRecoilValue = <T>(recoilVal: RecoilValue<T>) => T;

export type AlbumData = {
  artist: string;
  album: string;
  year: string;
};

export type SongData = {
  title: string;
  track: number;
} & AlbumData;

const log = MakeLogger('ReadOnly');
const err = MakeLogger('ReadOnly-err');

export const getMediaInfoState = selectorFamily<Map<string, string>, SongKey>({
  key: 'mediaInfoSelector',
  get: (sk: SongKey) => async (): Promise<Map<string, string>> => {
    if (!sk) return new Map<string, string>();
    const result = await ipc.GetMediaInfo(sk);
    if (!result) throw new Error(sk);
    log(`Got media info for ${sk}:`);
    log(result);
    return result;
  },
});

type SongMap = Map<SongKey, Song>;
type AlbumMap = Map<AlbumKey, Album>;
type ArtistMap = Map<ArtistKey, Artist>;
type MusicLibrary = { songs: SongMap; albums: AlbumMap; artists: ArtistMap };

const musicLibraryState = atom<MusicLibrary>({
  key: 'musicDatabase',
  default: {
    songs: new Map<SongKey, Song>(),
    albums: new Map<AlbumKey, Album>(),
    artists: new Map<ArtistKey, Artist>(),
  },
  effects_UNSTABLE: [syncWithMainEffect(true)],
});

export const allSongsState = selector<SongMap>({
  key: 'AllSongs',
  get: ({ get }): SongMap => {
    const ml = get(musicLibraryState);
    log(`AllSongs: #${ml.songs.size}`);
    return ml.songs;
  },
});

export const getSongByKeyState = selectorFamily<Song, SongKey>({
  key: 'SongByKey',
  get: (sk: SongKey) => ({ get }): Song => {
    const songs = get(allSongsState);
    const song = songs.get(sk);
    if (!song) {
      err(`Unfound song key: ${sk}`);
      throw new Error(sk);
    }
    return song;
  },
});

export const allAlbumsState = selector<AlbumMap>({
  key: 'AllAlbums',
  get: ({ get }): AlbumMap => get(musicLibraryState).albums,
});

export const getAlbumByKeyState = selectorFamily<Album, AlbumKey>({
  key: 'AlbumByKey',
  get: (ak: AlbumKey) => ({ get }): Album => {
    const albums = get(allAlbumsState);
    const album = albums.get(ak);
    if (!album) throw new Error(ak);
    return album;
  },
});

export const getMaybeAlbumByKeyState = selectorFamily<Album | null, AlbumKey>({
  key: 'MaybeAlbumByKey',
  get: (ak: AlbumKey) => ({ get }): Album | null => {
    if (ak.length === 0) return null;
    return get(getAlbumByKeyState(ak));
  },
});

export const allAlbumKeysState = selector<AlbumKey[]>({
  key: 'AllAlbumKeys',
  get: ({ get }) => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const albums = get(allAlbumsState);
    return [...albums.keys()];
  },
});

export const allArtistsState = selector<ArtistMap>({
  key: 'AllArtists',
  get: ({ get }): ArtistMap => get(musicLibraryState).artists,
});

export const getArtistByKeyState = selectorFamily<Artist, ArtistKey>({
  key: 'ArtistByKey',
  get: (ak: ArtistKey) => ({ get }): Artist => {
    const artists = get(allArtistsState);
    const artist = artists.get(ak);
    if (!artist) throw new Error(ak);
    return artist;
  },
});

export const getMaybeArtistByKeyState = selectorFamily<
  Artist | null,
  ArtistKey
>({
  key: 'MaybeArtistByKey',
  get: (ak: ArtistKey) => ({ get }): Artist | null => {
    if (ak.length === 0) return null;
    return get(getArtistByKeyState(ak));
  },
});

export const getAlbumKeyForSongKeyState = selectorFamily<AlbumKey, SongKey>({
  key: 'AlbumKeyForSongKey',
  get: (sk: SongKey) => ({ get }): AlbumKey => {
    if (sk.length > 0) {
      const song: Song = get(getSongByKeyState(sk));
      return song.albumId;
    } else {
      return '';
    }
  },
});

export const getArtistStringState = selectorFamily<string, ArtistKey[]>({
  key: 'ArtistString',

  get: (artistList: ArtistKey[]) => ({ get }): string => {
    if (artistList.length === 0) {
      return '';
    }
    const artists: string[] = artistList
      .map((ak) => {
        const art: Artist = get(getArtistByKeyState(ak));
        return art ? art.name : '';
      })
      .filter((a: string) => a.length > 0);
    if (artists.length === 1) {
      return artists[0];
    } else {
      const lastPart = ' & ' + (artists.pop() || 'OOPS!');
      return artists.join(', ') + lastPart;
    }
  },
});

export const curSongsState = selector<Song[]>({
  key: 'curSongs',
  get: ({ get }) => {
    const curList = get(songListState);
    const songList: Song[] = [];
    for (const sk of curList) {
      try {
        const s = get(getSongByKeyState(sk));
        songList.push(s);
      } catch (e) {
        err(`Error for SongKey '${sk}'`);
        err(e);
      }
    }
    return songList; // curList.map((sk: SongKey) => get(getSongByKeyState(sk)));
  },
});

export const getDataForSongState = selectorFamily<SongData, SongKey>({
  key: 'DataForSong',
  get: (sk: SongKey) => ({ get }): SongData => {
    const res = { title: '', track: 0, artist: '', album: '', year: '' };

    if (sk.length === 0) {
      return res;
    }
    const song: Song = get(getSongByKeyState(sk));
    if (!song) {
      return res;
    }
    const title = song.title;
    const track = song.track;

    return { title, track, ...get(getDataForAlbumState(song.albumId)) };
  },
});

export const getDataForAlbumState = selectorFamily<AlbumData, AlbumKey>({
  key: 'DataForAlbum',
  get: (ak: AlbumKey) => ({ get }): AlbumData => {
    const res = { artist: '', album: '', year: '' };
    if (!ak) {
      return res;
    }
    const album: Album = get(getAlbumByKeyState(ak));
    if (album) {
      res.album = album.title;
      res.year = album.year ? album.year.toString() : '';
    }
    if (album.primaryArtists.length) {
      const maybeArtistName = get(getArtistStringState(album.primaryArtists));
      if (maybeArtistName) {
        res.artist = maybeArtistName;
      }
    } else if (album.vatype === 'ost') {
      res.artist = 'Soundtrack';
    } else if (album.vatype === 'va') {
      res.artist = 'Compilation';
    } else {
      res.artist = '???';
    }
    return res;
  },
});

export const searchTermState = atom<string>({ key: 'searchTerm', default: '' });

export const getSearchState = selectorFamily<ipc.SearchResults, string>({
  key: 'search',
  get: (searchTerm: string) => async ({ get }): Promise<ipc.SearchResults> => {
    const res = await ipc.SearchWhole(searchTerm);
    if (res) {
      log('results:');
      log(res);
    } else {
      log('no results');
    }
    return res || { songs: [], albums: [], artists: [] };
  },
});
