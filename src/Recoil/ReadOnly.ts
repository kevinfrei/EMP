/* eslint-disable @typescript-eslint/naming-convention */
import { FlatAudioDatabase } from '@freik/audiodb';
import { MakeLogger, Type } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-core';
import { atom, RecoilValue, selector, selectorFamily } from 'recoil';
import * as ipc from '../ipc';
import { CallMain, SetDB } from '../MyWindow';
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

export const mediaInfoFuncFam = selectorFamily<Map<string, string>, SongKey>({
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

const emptyLibrary = {
  songs: new Map<SongKey, Song>(),
  albums: new Map<AlbumKey, Album>(),
  artists: new Map<ArtistKey, Artist>(),
};

function MakeMusicLibraryFromFlatAudioDatabase(fad: FlatAudioDatabase) {
  // For debugging, this is helpful sometimes:
  SetDB(fad);
  return {
    songs: new Map(fad.songs.map(swp => [swp.key, swp])),
    albums: new Map(fad.albums.map(alb => [alb.key, alb])),
    artists: new Map(fad.artists.map(art => [art.key, art])),
  };
}

const musicLibraryState = atom<MusicLibrary>({
  key: 'musicDatabase',
  default: emptyLibrary,
  effects_UNSTABLE: [
    oneWayFromMainEffect(
      async (): Promise<MusicLibrary> => {
        const fad = await CallMain(
          'get-music-database',
          undefined,
          IsFlatAudioDatabase,
        );
        return fad ? MakeMusicLibraryFromFlatAudioDatabase(fad) : emptyLibrary;
      },
      'music-database-update',
      (fad: unknown) => {
        if (IsFlatAudioDatabase(fad)) {
          return MakeMusicLibraryFromFlatAudioDatabase(fad);
        }
        err('Invalid result from music-database-update:');
        err(fad);
      },
    ),
  ],
});

export const allSongsFunc = selector<SongMap>({
  key: 'AllSongs',
  get: ({ get }): SongMap => {
    const ml = get(musicLibraryState);
    log(`AllSongs: #${ml.songs.size}`);
    return ml.songs;
  },
});

export const songByKeyFuncFam = selectorFamily<Song, SongKey>({
  key: 'SongByKey',
  get: (sk: SongKey) => ({ get }): Song => {
    const songs = get(allSongsFunc);
    const song = songs.get(sk);
    if (!song) {
      Fail(sk, 'Unfound song key');
    }
    return song;
  },
});

export const allAlbumsFunc = selector<AlbumMap>({
  key: 'AllAlbums',
  get: ({ get }): AlbumMap => get(musicLibraryState).albums,
});

export const albumByKeyFuncFam = selectorFamily<Album, AlbumKey>({
  key: 'AlbumByKey',
  get: (ak: AlbumKey) => ({ get }): Album => {
    const albums = get(allAlbumsFunc);
    const album = albums.get(ak);
    if (!album) {
      Fail(ak, 'Unfound album key');
    }
    return album;
  },
});

export const maybeAlbumByKeyFuncFam = selectorFamily<Album | null, AlbumKey>({
  key: 'MaybeAlbumByKey',
  get: (ak: AlbumKey) => ({ get }): Album | null => {
    if (ak.length === 0) return null;
    return get(albumByKeyFuncFam(ak));
  },
});

export const allAlbumKeysFunc = selector<AlbumKey[]>({
  key: 'AllAlbumKeys',
  get: ({ get }) => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const albums = get(allAlbumsFunc);
    return [...albums.keys()];
  },
});

export const allArtistsFunc = selector<ArtistMap>({
  key: 'AllArtists',
  get: ({ get }): ArtistMap => get(musicLibraryState).artists,
});

export const artistByKeyFuncFam = selectorFamily<Artist, ArtistKey>({
  key: 'ArtistByKey',
  get: (ak: ArtistKey) => ({ get }): Artist => {
    const artists = get(allArtistsFunc);
    const artist = artists.get(ak);
    if (!artist) {
      Fail(ak, 'Unfound artist key');
    }
    return artist;
  },
});

export const maybeArtistByKeyFuncFam = selectorFamily<Artist | null, ArtistKey>(
  {
    key: 'MaybeArtistByKey',
    get: (ak: ArtistKey) => ({ get }): Artist | null => {
      if (ak.length === 0) return null;
      return get(artistByKeyFuncFam(ak));
    },
  },
);

export const albumKeyForSongKeyFuncFam = selectorFamily<AlbumKey, SongKey>({
  key: 'AlbumKeyForSongKey',
  get: (sk: SongKey) => ({ get }): AlbumKey => {
    if (sk.length > 0) {
      const song: Song = get(songByKeyFuncFam(sk));
      return song.albumId;
    } else {
      return '';
    }
  },
});

export const artistStringFuncFam = selectorFamily<string, ArtistKey[]>({
  key: 'ArtistString',

  get: (artistList: ArtistKey[]) => ({ get }): string => {
    if (artistList.length === 0) {
      return '';
    }
    const artists: string[] = artistList
      .map(ak => {
        const art: Artist = get(artistByKeyFuncFam(ak));
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

export const curSongsFunc = selector<Song[]>({
  key: 'curSongs',
  get: ({ get }) => {
    const curList = get(songListState);
    const songList: Song[] = [];
    for (const sk of curList) {
      try {
        const s = get(songByKeyFuncFam(sk));
        songList.push(s);
      } catch (e) {
        Catch(e, `Error for SongKey '${sk}'`);
      }
    }
    return songList; // curList.map((sk: SongKey) => get(getSongByKeyState(sk)));
  },
});

export const dataForSongFuncFam = selectorFamily<SongData, SongKey>({
  key: 'DataForSong',
  get: (sk: SongKey) => ({ get }): SongData => {
    const res = { title: '', track: 0, artist: '', album: '', year: '' };

    if (sk.length === 0) {
      return res;
    }
    const song: Song = get(songByKeyFuncFam(sk));
    if (!song) {
      return res;
    }
    const title = song.title;
    const track = song.track;

    return { title, track, ...get(dataForAlbumFuncFam(song.albumId)) };
  },
});

export const dataForSongListFuncFam = selectorFamily<SongData[], SongKey[]>({
  key: 'DataForSongs',
  get: (sks: SongKey[]) => ({ get }): SongData[] =>
    sks.map((sk: SongKey) => get(dataForSongFuncFam(sk))),
});

export const maybeDataForSongFunc = selectorFamily<SongData | null, SongKey[]>({
  key: 'DataForSong',
  get: ssk => ({ get }): SongData | null => {
    if (ssk.length !== 1) {
      return null;
    }
    return get(dataForSongFuncFam(ssk[0]));
  },
});

export const dataForAlbumFuncFam = selectorFamily<AlbumData, AlbumKey>({
  key: 'DataForAlbum',
  get: (ak: AlbumKey) => ({ get }): AlbumData => {
    const res = { artist: '', album: '', year: '' };
    if (!ak) {
      return res;
    }
    const album: Album = get(albumByKeyFuncFam(ak));
    if (album) {
      res.album = album.title;
      res.year = album.year ? album.year.toString() : '';
    }
    if (album.primaryArtists.length) {
      const maybeArtistName = get(artistStringFuncFam(album.primaryArtists));
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

export const searchFuncFam = selectorFamily<ipc.SearchResults, string>({
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

type SongInfo = {
  song: Song;
  artists: string;
  moreArtists: string;
  album: Album;
};

function diskNumName(songData: SongInfo): [string | null, string | null] {
  const diskNo = Math.floor(songData.song.track / 100);
  if (diskNo > 0) {
    if (Type.hasType(songData.album, 'diskNames', Type.isArrayOfString)) {
      return [diskNo.toString(), songData.album.diskNames[diskNo - 1]];
    }
    return [diskNo.toString(), null];
  } else {
    return [null, null];
  }
}

// Given a collection of SongKeys, get all the common metadata info
// and shove it in the Partial<FullMetadata> object
// This is used in conjunction with the Metadata Editor
export const commonDataFuncFam = selectorFamily<MetadataProps, SongKey[]>({
  key: 'commonData',
  get: (keys: SongKey[]) => ({ get }) => {
    const theSongsData: SongInfo[] = keys.map(songKey => {
      const song = get(songByKeyFuncFam(songKey));
      const artists = get(artistStringFuncFam(song.artistIds));
      const moreArtists = get(artistStringFuncFam(song.secondaryIds));
      const album = get(albumByKeyFuncFam(song.albumId));
      return { song, artists, moreArtists, album };
    });
    let artist: string | null = null;
    let albumTitle: string | null = null;
    let year: string | null = null;
    let va: 'va' | 'ost' | '' | null = null;
    let moreArtistsList: string | null = null;
    let variations: string | null = null;
    let albumId: string | null = null;
    let diskNum: string | null = null;
    let diskName: string | null = null;
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
        [diskNum, diskName] = diskNumName(songData);
      } else {
        if (artist !== songData.artists) artist = null;
        if (albumTitle !== songData.album.title) albumTitle = null;
        if (year !== songData.album.year.toString()) year = null;
        if (va !== songData.album.vatype) va = null;
        if (moreArtistsList !== songData.moreArtists) moreArtistsList = null;
        if (variations !== songData.song.variations?.join(';'))
          variations = null;
        if (albumId !== songData.album.key) albumId = null;
        const [thisDiskNum, thisDiskName] = diskNumName(songData);
        if (diskNum !== thisDiskNum) diskNum = null;
        if (diskName !== thisDiskName) diskName = null;
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
    if (diskName !== null) {
      props.diskName = diskName;
    }
    return props;
  },
});
