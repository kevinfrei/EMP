/* eslint-disable @typescript-eslint/naming-convention */
import { MakeLogger, SafelyUnpickle, Type } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-core';
import { FlatAudioDatabase } from 'audio-database';
import { atom, RecoilValue, selector, selectorFamily } from 'recoil';
import * as ipc from '../ipc';
import { InvokeMain } from '../MyWindow';
import { Catch, Fail } from '../Tools';
import { MetadataProps } from '../UI/DetailPanel/MetadataEditor';
import { oneWayFromMainEffect } from './helpers';
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

const log = MakeLogger('ReadOnly'); // eslint-disable-line
const err = MakeLogger('ReadOnly-err'); // eslint-disable-line

export const getMediaInfoFamily = selectorFamily<Map<string, string>, SongKey>({
  key: 'mediaInfoSelector',
  get: (sk: SongKey) => async (): Promise<Map<string, string>> => {
    if (!sk) return new Map<string, string>();
    const result = await ipc.GetMediaInfo(sk);
    if (!result) {
      Fail(sk, 'Unfound song key');
    }
    log(`Got media info for ${sk}:`);
    log(result);
    return result;
  },
});

type SongMap = Map<SongKey, Song>;
type AlbumMap = Map<AlbumKey, Album>;
type ArtistMap = Map<ArtistKey, Artist>;
type MusicLibrary = { songs: SongMap; albums: AlbumMap; artists: ArtistMap };

function isSong(sng: unknown): sng is Song {
  return (
    Type.hasStr(sng, 'key') &&
    Type.hasType(sng, 'track', Type.isNumber) &&
    Type.hasStr(sng, 'title') &&
    Type.hasStr(sng, 'albumId') &&
    Type.hasType(sng, 'artistIds', Type.isArrayOfString) &&
    (!Type.has(sng, 'secondaryIds') ||
      Type.isArrayOfString(sng.secondaryIds)) &&
    (!Type.has(sng, 'variations') || Type.isArrayOfString(sng.variations))
  );
}

function isAlbum(alb: unknown): alb is Album {
  return (
    Type.hasStr(alb, 'key') &&
    Type.hasType(alb, 'year', Type.isNumber) &&
    Type.hasStr(alb, 'title') &&
    (!Type.hasStr(alb, 'vatype') ||
      alb.vatype === '' ||
      alb.vatype === 'ost' ||
      alb.vatype === 'va') &&
    Type.hasType(alb, 'primaryArtists', Type.isArrayOfString) &&
    Type.hasType(alb, 'songs', Type.isArrayOfString)
  );
}

function isArtist(art: unknown): art is Artist {
  return (
    Type.hasStr(art, 'key') &&
    Type.hasStr(art, 'name') &&
    Type.hasType(art, 'albums', Type.isArrayOfString) &&
    Type.hasType(art, 'songs', Type.isArrayOfString)
  );
}

function IsFlatAudioDatabase(val: unknown): val is FlatAudioDatabase {
  return (
    Type.has(val, 'songs') &&
    Type.isArrayOf(val.songs, isSong) &&
    Type.has(val, 'albums') &&
    Type.isArrayOf(val.albums, isAlbum) &&
    Type.has(val, 'artists') &&
    Type.isArrayOf(val.artists, isArtist)
  );
}

const musicLibraryState = atom<MusicLibrary>({
  key: 'musicDatabase',
  default: {
    songs: new Map<SongKey, Song>(),
    albums: new Map<AlbumKey, Album>(),
    artists: new Map<ArtistKey, Artist>(),
  },
  effects_UNSTABLE: [
    oneWayFromMainEffect(
      async (): Promise<MusicLibrary> => {
        const res = await InvokeMain('get-music-database');
        if (res) {
          const ml = SafelyUnpickle(res, IsFlatAudioDatabase);
          if (ml !== undefined) {
            return {
              songs: new Map(ml.songs.map((swp) => [swp.key, swp])),
              albums: new Map(ml.albums.map((alb) => [alb.key, alb])),
              artists: new Map(ml.artists.map((art) => [art.key, art])),
            };
          }
        }
        throw Error(`Invalid value coming from get-music-database`);
      },
      'music-database-update',
      (data: unknown) => {
        if (IsFlatAudioDatabase(data)) {
          const ml = data;
          return {
            songs: new Map(ml.songs.map((swp) => [swp.key, swp])),
            albums: new Map(ml.albums.map((alb) => [alb.key, alb])),
            artists: new Map(ml.artists.map((art) => [art.key, art])),
          };
        }
        err('Invalid result from music-database-update:');
        err(data);
      },
    ),
  ],
});

export const allSongsState = selector<SongMap>({
  key: 'AllSongs',
  get: ({ get }): SongMap => {
    const ml = get(musicLibraryState);
    log(`AllSongs: #${ml.songs.size}`);
    return ml.songs;
  },
});

export const getSongByKeyFamily = selectorFamily<Song, SongKey>({
  key: 'SongByKey',
  get:
    (sk: SongKey) =>
    ({ get }): Song => {
      const songs = get(allSongsState);
      const song = songs.get(sk);
      if (!song) {
        Fail(sk, 'Unfound song key');
      }
      return song;
    },
});

export const allAlbumsState = selector<AlbumMap>({
  key: 'AllAlbums',
  get: ({ get }): AlbumMap => get(musicLibraryState).albums,
});

export const getAlbumByKeyFamily = selectorFamily<Album, AlbumKey>({
  key: 'AlbumByKey',
  get:
    (ak: AlbumKey) =>
    ({ get }): Album => {
      const albums = get(allAlbumsState);
      const album = albums.get(ak);
      if (!album) {
        Fail(ak, 'Unfound album key');
      }
      return album;
    },
});

export const getMaybeAlbumByKeyFamily = selectorFamily<Album | null, AlbumKey>({
  key: 'MaybeAlbumByKey',
  get:
    (ak: AlbumKey) =>
    ({ get }): Album | null => {
      if (ak.length === 0) return null;
      return get(getAlbumByKeyFamily(ak));
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

export const getArtistByKeyFamily = selectorFamily<Artist, ArtistKey>({
  key: 'ArtistByKey',
  get:
    (ak: ArtistKey) =>
    ({ get }): Artist => {
      const artists = get(allArtistsState);
      const artist = artists.get(ak);
      if (!artist) {
        Fail(ak, 'Unfound artist key');
      }
      return artist;
    },
});

export const getMaybeArtistByKeyFamily = selectorFamily<
  Artist | null,
  ArtistKey
>({
  key: 'MaybeArtistByKey',
  get:
    (ak: ArtistKey) =>
    ({ get }): Artist | null => {
      if (ak.length === 0) return null;
      return get(getArtistByKeyFamily(ak));
    },
});

export const getAlbumKeyForSongKeyFamily = selectorFamily<AlbumKey, SongKey>({
  key: 'AlbumKeyForSongKey',
  get:
    (sk: SongKey) =>
    ({ get }): AlbumKey => {
      if (sk.length > 0) {
        const song: Song = get(getSongByKeyFamily(sk));
        return song.albumId;
      } else {
        return '';
      }
    },
});

export const getArtistStringFamily = selectorFamily<string, ArtistKey[]>({
  key: 'ArtistString',

  get:
    (artistList: ArtistKey[]) =>
    ({ get }): string => {
      if (artistList.length === 0) {
        return '';
      }
      const artists: string[] = artistList
        .map((ak) => {
          const art: Artist = get(getArtistByKeyFamily(ak));
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
        const s = get(getSongByKeyFamily(sk));
        songList.push(s);
      } catch (e) {
        Catch(e, `Error for SongKey '${sk}'`);
      }
    }
    return songList; // curList.map((sk: SongKey) => get(getSongByKeyState(sk)));
  },
});

export const getDataForSongFamily = selectorFamily<SongData, SongKey>({
  key: 'DataForSong',
  get:
    (sk: SongKey) =>
    ({ get }): SongData => {
      const res = { title: '', track: 0, artist: '', album: '', year: '' };

      if (sk.length === 0) {
        return res;
      }
      const song: Song = get(getSongByKeyFamily(sk));
      if (!song) {
        return res;
      }
      const title = song.title;
      const track = song.track;

      return { title, track, ...get(getDataForAlbumFamily(song.albumId)) };
    },
});

export const getDataForSongListFamily = selectorFamily<SongData[], SongKey[]>({
  key: 'DataForSongs',
  get:
    (sks: SongKey[]) =>
    ({ get }): SongData[] =>
      sks.map((sk: SongKey) => get(getDataForSongFamily(sk))),
});

export const maybeGetDataForSongState = selectorFamily<
  SongData | null,
  SongKey[]
>({
  key: 'DataForSong',
  get:
    (ssk) =>
    ({ get }): SongData | null => {
      if (ssk.length !== 1) {
        return null;
      }
      return get(getDataForSongFamily(ssk[0]));
    },
});

export const getDataForAlbumFamily = selectorFamily<AlbumData, AlbumKey>({
  key: 'DataForAlbum',
  get:
    (ak: AlbumKey) =>
    ({ get }): AlbumData => {
      const res = { artist: '', album: '', year: '' };
      if (!ak) {
        return res;
      }
      const album: Album = get(getAlbumByKeyFamily(ak));
      if (album) {
        res.album = album.title;
        res.year = album.year ? album.year.toString() : '';
      }
      if (album.primaryArtists.length) {
        const maybeArtistName = get(
          getArtistStringFamily(album.primaryArtists),
        );
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

export const getSearchFamily = selectorFamily<ipc.SearchResults, string>({
  key: 'search',
  get:
    (searchTerm: string) =>
    async ({ get }): Promise<ipc.SearchResults> => {
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

// Given a collection of SongKeys, get all the common metadata info
// and shove it in the Partial<FullMetadata> object
// This is used in conjunction with the Metadata Editor
export const getCommonDataFamily = selectorFamily<MetadataProps, SongKey[]>({
  key: 'commonData',
  get:
    (keys: SongKey[]) =>
    ({ get }) => {
      const theSongsData = keys.map((songKey) => {
        const song = get(getSongByKeyFamily(songKey));
        const artists = get(getArtistStringFamily(song.artistIds));
        const moreArtists = get(getArtistStringFamily(song.secondaryIds));
        const album = get(getAlbumByKeyFamily(song.albumId));
        return { song, artists, moreArtists, album };
      });
      let artist: string | null = null;
      let albumTitle: string | null = null;
      let year: string | null = null;
      let va: 'va' | 'ost' | '' | null = null;
      let moreArtistsList: string | null = null;
      let variations: string | null = null;
      let albumId: string | null = null;
      let first = true;
      for (const songData of theSongsData) {
        if (first) {
          artist = songData.artists;
          albumTitle = songData.album.title;
          year =
            songData.album.year !== 0 ? songData.album.year.toString() : null;
          va = songData.album.vatype;
          moreArtistsList = songData.moreArtists;
          variations = songData.song.variations
            ? songData.song.variations.join(';')
            : null;
          albumId = songData.album.key;
          first = false;
        } else {
          if (artist !== songData.artists) artist = null;
          if (albumTitle !== songData.album.title) albumTitle = null;
          if (year !== songData.album.year.toString()) year = null;
          if (va !== songData.album.vatype) va = null;
          if (moreArtistsList !== songData.moreArtists) moreArtistsList = null;
          if (variations !== songData.song.variations?.join(';'))
            variations = null;
          if (albumId !== songData.album.key) albumId = null;
        }
      }
      const props: MetadataProps = {};
      if (artist !== null) {
        props.artist = artist;
      }
      if (albumTitle !== null) {
        props.album = albumTitle;
      }
      if (year !== null) {
        props.year = year;
      }
      if (va !== null) {
        props.va = va;
      }
      if (variations !== null) {
        props.variations = variations;
      }
      if (moreArtistsList !== null) {
        props.moreArtists = moreArtistsList;
      }
      if (albumId !== null) {
        props.albumId = albumId;
      }
      return props;
    },
});
