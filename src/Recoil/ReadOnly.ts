import { Effects, Ipc } from '@freik/electron-render';
import { IgnoreItem, IpcId, isIgnoreItemArray } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  MediaKey,
  Song,
  SongKey,
  isSongKey,
} from '@freik/media-core';
import { hasFieldType, isArrayOfString, isString } from '@freik/typechk';
import { Catch, Fail } from '@freik/web-utils';
import { atom, selector, selectorFamily } from 'recoil';
import * as ipc from '../ipc';
import {
  AlbumDescriptionWithKey,
  AlbumMap,
  ArtistMap,
  MakeMusicLibraryFromFlatAudioDatabase,
  MusicLibrary,
  SongDescription,
  SongMap,
  emptyLibrary,
  isFlatAudioDatabase,
} from '../MusicLibrarySchema';
import { MetadataProps } from '../UI/DetailPanel/MetadataProps';
import { songListState } from './SongPlaying';

// import {
//   minSongCountForArtistListState,
//   showArtistsWithFullAlbumsState,
// } from './Preferences';

const { wrn, log } = MakeLog('EMP:render:ReadOnly:log');

// type GetRecoilValue = <T>(recoilVal: RecoilValue<T>) => T;

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

export const picForKeyFam = selectorFamily<string, MediaKey>({
  key: 'picForkey',
  get:
    (mk: MediaKey) =>
    async ({ get }): Promise<string> => {
      if (isSongKey(mk)) {
        mk = get(albumKeyForSongKeyFuncFam(mk));
      }
      const data = await ipc.GetPicDataUri(mk);
      return isString(data) ? data : 'error';
    },
});

const musicLibraryState = atom<MusicLibrary>({
  key: 'musicDatabase',
  effects: [
    Effects.oneWayFromMain(
      async (): Promise<MusicLibrary> => {
        const fad = await Ipc.CallMain(
          IpcId.GetMusicDatabase,
          undefined,
          isFlatAudioDatabase,
        );
        return fad ? MakeMusicLibraryFromFlatAudioDatabase(fad) : emptyLibrary;
      },
      IpcId.MusicDBUpdate,
      (fad: unknown) => {
        if (isFlatAudioDatabase(fad)) {
          return MakeMusicLibraryFromFlatAudioDatabase(fad);
        }
        wrn('Invalid result from music-database-update:');
        wrn(fad);
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
  get:
    (sk: SongKey) =>
    ({ get }): Song => {
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
  get:
    (ak: AlbumKey) =>
    ({ get }): Album => {
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
  get:
    (ak: AlbumKey) =>
    ({ get }): Album | null => {
      if (ak.length === 0) return null;
      return get(albumByKeyFuncFam(ak));
    },
});

// const allAlbumKeysFunc = selector<AlbumKey[]>({
//   key: 'AllAlbumKeys',
//   get: ({ get }) => {
//     // Get the locations to make sure that if they change,
//     // we get the new song list
//     const albums = get(allAlbumsFunc);
//     return [...albums.keys()];
//   },
// });

export const allArtistsFunc = selector<ArtistMap>({
  key: 'AllArtists',
  get: ({ get }): ArtistMap => get(musicLibraryState).artists,
});

export const artistByKeyFuncFam = selectorFamily<Artist, ArtistKey>({
  key: 'ArtistByKey',
  get:
    (ak: ArtistKey) =>
    ({ get }): Artist => {
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
    get:
      (ak: ArtistKey) =>
      ({ get }): Artist | null => {
        if (ak.length === 0) return null;
        return get(artistByKeyFuncFam(ak));
      },
  },
);

export const albumKeyForSongKeyFuncFam = selectorFamily<AlbumKey, SongKey>({
  key: 'AlbumKeyForSongKey',
  get:
    (sk: SongKey) =>
    ({ get }): AlbumKey => {
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
  get:
    (artistList: ArtistKey[]) =>
    ({ get }): string => {
      if (artistList.length === 0) {
        return '';
      }
      const artists: string[] = artistList
        .map((ak) => {
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

export const dataForSongFuncFam = selectorFamily<SongDescription, SongKey>({
  key: 'DataForSong',
  get:
    (sk: SongKey) =>
    ({ get }): SongDescription => {
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

export const dataForSongListFuncFam = selectorFamily<
  SongDescription[],
  SongKey[]
>({
  key: 'DataForSongs',
  get:
    (sks: SongKey[]) =>
    ({ get }): SongDescription[] =>
      sks.map((sk: SongKey) => get(dataForSongFuncFam(sk))),
});

export const maybeDataForSongFunc = selectorFamily<
  SongDescription | null,
  SongKey[]
>({
  key: 'DataForSong',
  get:
    (ssk) =>
    ({ get }): SongDescription | null => {
      if (ssk.length !== 1) {
        return null;
      }
      return get(dataForSongFuncFam(ssk[0]));
    },
});

export const dataForAlbumFuncFam = selectorFamily<
  AlbumDescriptionWithKey,
  AlbumKey
>({
  key: 'DataForAlbum',
  get:
    (ak: AlbumKey) =>
    ({ get }): AlbumDescriptionWithKey => {
      const res = { artist: '', album: '', year: '', key: '' };
      if (!ak) {
        return res;
      }
      const album: Album = get(albumByKeyFuncFam(ak));
      if (album) {
        res.album = album.title;
        res.year = album.year ? album.year.toString() : '';
      }
      res.key = ak;
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

export const allAlbumsDataFunc = selector<AlbumDescriptionWithKey[]>({
  key: 'AllAlbumData',
  get: ({ get }) => {
    const allAlbums = get(allAlbumsFunc);
    return [...allAlbums.keys()].map((l: AlbumKey) =>
      get(dataForAlbumFuncFam(l)),
    );
  },
});

export const searchTermState = atom<string>({ key: 'searchTerm', default: '' });
export const metadataEditCountState = atom<number>({
  key: 'metadataEditCount',
  default: 0,
});
export const searchFuncFam = selectorFamily<ipc.SearchResults, string>({
  key: 'search',
  get:
    (searchTerm: string) =>
    async ({ get }): Promise<ipc.SearchResults> => {
      const mdCount = get(metadataEditCountState);
      const res = await ipc.SearchWhole(searchTerm);
      return res || { songs: [], albums: [], artists: [] } || mdCount;
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
    if (hasFieldType(songData.album, 'diskNames', isArrayOfString)) {
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
  get:
    (keys: SongKey[]) =>
    ({ get }) => {
      const theSongsData: SongInfo[] = keys.map((songKey) => {
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

export const filteredArtistsFunc = selector<Artist[]>({
  key: 'filteredArtists',
  get: ({ get }) => {
    const fullAlbums = false; // get(showArtistsWithFullAlbumsState);
    const minSongCount = 3; // get(minSongCountForArtistListState);
    const artists = [...get(allArtistsFunc).values()];
    if (fullAlbums) {
      const albums = get(allAlbumsFunc);
      return artists.filter((artist) => {
        for (const lKey of artist.albums) {
          const album = albums.get(lKey);
          if (album && album.primaryArtists.indexOf(artist.key) >= 0) {
            return true;
          }
        }
        return false;
      });
    } else if (minSongCount > 1) {
      return artists.filter((artist) => artist.songs.length >= minSongCount);
    }
    return artists;
  },
});

export const ignoreItemsState = atom<IgnoreItem[]>({
  key: 'IgnoreItemsState',
  effects: [
    Effects.oneWayFromMain(
      async (): Promise<IgnoreItem[]> => {
        const il = await Ipc.CallMain(
          IpcId.GetIgnoreList,
          undefined,
          isIgnoreItemArray,
        );
        return il || [];
      },
      IpcId.PushIgnoreList,
      (il: unknown) => {
        if (isIgnoreItemArray(il)) {
          return il;
        }
        wrn('Invalid result from ignore-items-update:');
        wrn(il);
      },
    ),
  ],
});

/*
export const RescanInProgressState = atom<boolean>({
  key: 'RescanInProgress',
  effects: [
    Effects.oneWayFromMain(
      () => false,
      IpcId.RescanInProgress,
      (info: unknown) => {
        if (isBoolean(info)) {
          return info;
        }
        wrn('Invalid RescanInProgress value:');
        wrn(typeof info);
        wrn(info);
      },
    ),
  ],
});
*/
