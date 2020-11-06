/* eslint-disable @typescript-eslint/naming-convention */
import { MakeLogger } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-utils';
import { atom, RecoilValue, selector, selectorFamily } from 'recoil';
import * as ipc from '../ipc';
import { syncWithMainEffect } from './helpers';
import { songListAtom } from './Local';

export type GetRecoilValue = <T>(recoilVal: RecoilValue<T>) => T;

export type AlbumData = {
  artist: string;
  album: string;
  year: number;
};

export type SongData = {
  title: string;
  track: number;
} & AlbumData;

const log = MakeLogger('ReadOnly');
const err = MakeLogger('ReadOnly-err', true);

export const getMediaInfo = selectorFamily<Map<string, string>, SongKey>({
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

const musicLibraryAtom = atom<MusicLibrary>({
  key: 'musicDatabase',
  default: {
    songs: new Map<SongKey, Song>(),
    albums: new Map<AlbumKey, Album>(),
    artists: new Map<ArtistKey, Artist>(),
  },
  effects_UNSTABLE: [syncWithMainEffect(true)],
});

export const allSongsSel = selector<SongMap>({
  key: 'AllSongs',
  get: ({ get }): SongMap => {
    const ml = get(musicLibraryAtom);
    log(`AllSongs: #${ml.songs.size}`);
    return ml.songs;
  },
});

export const songByKeySel = selectorFamily<Song, SongKey>({
  key: 'SongByKey',
  get: (sk: SongKey) => ({ get }): Song => {
    const songs = get(allSongsSel);
    const song = songs.get(sk);
    if (!song) throw new Error(sk);
    return song;
  },
});

export const allAlbumsSel = selector<AlbumMap>({
  key: 'AllAlbums',
  get: ({ get }): AlbumMap => get(musicLibraryAtom).albums,
});

export const albumByKeySel = selectorFamily<Album, AlbumKey>({
  key: 'AlbumByKey',
  get: (ak: AlbumKey) => ({ get }): Album => {
    const albums = get(allAlbumsSel);
    const album = albums.get(ak);
    if (!album) throw new Error(ak);
    return album;
  },
});

export const maybeAlbumByKeySel = selectorFamily<Album | null, AlbumKey>({
  key: 'MaybeAlbumByKey',
  get: (ak: AlbumKey) => ({ get }): Album | null => {
    if (ak.length === 0) return null;
    return get(albumByKeySel(ak));
  },
});

export const allAlbumKeysSel = selector<AlbumKey[]>({
  key: 'AllAlbumKeys',
  get: ({ get }) => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const albums = get(allAlbumsSel);
    return [...albums.keys()];
  },
});

export const allArtistsSel = selector<ArtistMap>({
  key: 'AllArtists',
  get: ({ get }): ArtistMap => get(musicLibraryAtom).artists,
});

export const artistByKeySel = selectorFamily<Artist, ArtistKey>({
  key: 'ArtistByKey',
  get: (ak: ArtistKey) => ({ get }): Artist => {
    const artists = get(allArtistsSel);
    const artist = artists.get(ak);
    if (!artist) throw new Error(ak);
    return artist;
  },
});

export const maybeArtistByKeySel = selectorFamily<Artist | null, ArtistKey>({
  key: 'MaybeArtistByKey',
  get: (ak: ArtistKey) => ({ get }): Artist | null => {
    if (ak.length === 0) return null;
    return get(artistByKeySel(ak));
  },
});

export const albumKeyForSongKeySel = selectorFamily<AlbumKey, SongKey>({
  key: 'AlbumKeyForSongKey',
  get: (sk: SongKey) => ({ get }): AlbumKey => {
    if (sk.length > 0) {
      const song: Song = get(songByKeySel(sk));
      return song.albumId;
    } else {
      return '';
    }
  },
});

export const artistStringSel = selectorFamily<string, ArtistKey[]>({
  key: 'ArtistString',

  get: (artistList: ArtistKey[]) => ({ get }): string => {
    const artists: string[] = artistList
      .map((ak) => {
        const art: Artist = get(artistByKeySel(ak));
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

export const curSongsSel = selector<Song[]>({
  key: 'curSongs',
  get: ({ get }) => {
    const curList = get(songListAtom);
    return curList.map((sk: SongKey) => get(songByKeySel(sk)));
  },
});

export const dataForSongSel = selectorFamily<SongData, SongKey>({
  key: 'DataForSong',
  get: (sk: SongKey) => ({ get }): SongData => {
    const res = { title: '', track: 0, artist: '', album: '', year: 0 };

    if (sk.length === 0) {
      return res;
    }
    const song: Song = get(songByKeySel(sk));
    if (!song) {
      return res;
    }
    const title = song.title;
    const track = song.track;

    return { title, track, ...get(dataForAlbumSel(song.albumId)) };
  },
});

export const dataForAlbumSel = selectorFamily<AlbumData, AlbumKey>({
  key: 'DataForAlbum',
  get: (ak: AlbumKey) => ({ get }): AlbumData => {
    const res = { artist: '', album: '', year: 0 };
    if (!ak) {
      return res;
    }
    const album: Album = get(albumByKeySel(ak));
    if (album) {
      res.album = album.title;
      res.year = album.year;
    }
    const maybeArtistName = get(artistStringSel(album.primaryArtists));
    if (!maybeArtistName) {
      return res;
    }
    res.artist = maybeArtistName;
    return res;
  },
});

export const searchTermAtom = atom<string>({ key: 'searchTerm', default: '' });

export const searchSel = selectorFamily<ipc.SearchResults, string>({
  key: 'search',
  get: (searchTerm: string) => async ({ get }): Promise<ipc.SearchResults> => {
    const res = await ipc.SearchWhole(searchTerm);
    if (res) {
      log('results:');
      log(res);
    } else {
      err('no results');
    }
    return res || { songs: [], albums: [], artists: [] };
  },
});
