/* eslint-disable @typescript-eslint/naming-convention */
import { FlatAudioDatabase } from '@freik/audiodb';
import { isIgnoreItemArrayFn } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  MediaKey,
  Song,
  SongKey,
  isAlbumKey,
  isArtistKey,
  isSongKey,
} from '@freik/media-core';
import {
  chkArrayOf,
  chkObjectOfType,
  hasFieldType,
  isArrayOfString,
  isBoolean,
  isNumber,
  isString,
} from '@freik/typechk';
import { Catch, Fail } from '@freik/web-utils';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { SetDB } from '../MyWindow';
import { MetadataProps } from '../UI/DetailPanel/MetadataEditor';
import * as ipc from '../ipc';
import {
  minSongCountForArtistListState,
  showArtistsWithFullAlbumsState,
} from './SimpleSettings';
import { songListState } from './SongsPlaying';
import { atomFromIpc, atomFromMain } from './Storage';
// import { songListState } from './SongPlaying';

const { wrn, log } = MakeLog('EMP:render:ReadOnly:log'); // eslint-disable-line

export type AlbumDescription = {
  artist: string;
  album: string;
  year: string;
};

export type AlbumDescriptionWithKey = {
  key: AlbumKey;
} & AlbumDescription;

export type SongDescription = {
  title: string;
  track: number;
} & AlbumDescription;

export type SongMap = Map<SongKey, Song>;
export type AlbumMap = Map<AlbumKey, Album>;
export type ArtistMap = Map<ArtistKey, Artist>;
export type MusicLibrary = {
  songs: SongMap;
  albums: AlbumMap;
  artists: ArtistMap;
};

const isSong = chkObjectOfType<Song & { path?: string }>(
  {
    key: isString,
    track: isNumber,
    title: isString,
    albumId: isString,
    artistIds: isArrayOfString,
    secondaryIds: isArrayOfString,
  },
  { path: isString, variations: isArrayOfString },
);

const isAlbum = chkObjectOfType<Album>(
  {
    key: isString,
    year: isNumber,
    title: isString,
    primaryArtists: isArrayOfString,
    songs: isArrayOfString,
    vatype: (o: unknown) => o === '' || o === 'ost' || o === 'va',
  },
  {
    diskNames: isArrayOfString,
  },
);

const isArtist = chkObjectOfType<Artist>({
  key: isString,
  name: isString,
  albums: isArrayOfString,
  songs: isArrayOfString,
});

const isFlatAudioDatabase = chkObjectOfType<FlatAudioDatabase>({
  songs: chkArrayOf(isSong),
  albums: chkArrayOf(isAlbum),
  artists: chkArrayOf(isArtist),
});

const emptyLibrary = {
  songs: new Map<SongKey, Song>(),
  albums: new Map<AlbumKey, Album>(),
  artists: new Map<ArtistKey, Artist>(),
};

function MakeMusicLibraryFromFlatAudioDatabase(
  fad: FlatAudioDatabase,
): MusicLibrary {
  // For debugging, this is helpful sometimes:
  SetDB(fad);
  return {
    songs: new Map(fad.songs.map((swp) => [swp.key, swp])),
    albums: new Map(fad.albums.map((alb) => [alb.key, alb])),
    artists: new Map(fad.artists.map((art) => [art.key, art])),
  };
}

const musicLibraryState = atomFromIpc<FlatAudioDatabase, MusicLibrary>(
  'musicDatabase',
  isFlatAudioDatabase,
  MakeMusicLibraryFromFlatAudioDatabase,
);

export const allSongsFunc = atom(
  async (get) => (await get(musicLibraryState)).songs,
);

export const songExistsFam = atomFamily((key: SongKey) =>
  atom(async (get) => (await get(allSongsFunc)).has(key)),
);

export const songByKeyFuncFam = atomFamily((sk: SongKey) =>
  atom(async (get) => {
    const songs = await get(allSongsFunc);
    const song = songs.get(sk);
    if (!song) {
      Fail(sk, 'Unfound song key');
    }
    return song;
  }),
);

export const allAlbumsFunc = atom(
  async (get) => (await get(musicLibraryState)).albums,
);

export const albumByKeyFuncFam = atomFamily((ak: AlbumKey) =>
  atom(async (get) => {
    const albums = await get(allAlbumsFunc);
    const album = albums.get(ak);
    if (!album) {
      Fail(ak, 'Unfound album key');
    }
    return album;
  }),
);

export const maybeAlbumByKeyFuncFam = atomFamily((ak: AlbumKey) =>
  atom(async (get) =>
    ak.length === 0 ? null : await get(albumByKeyFuncFam(ak)),
  ),
);

// const allAlbumKeysFunc = selector<AlbumKey[]>({
//   key: 'AllAlbumKeys',
//   get: ({ get }) => {
//     // Get the locations to make sure that if they change,
//     // we get the new song list
//     const albums = get(allAlbumsFunc);
//     return [...albums.keys()];
//   },
// });

export const allArtistsFunc = atom(
  async (get) => (await get(musicLibraryState)).artists,
);

export const artistByKeyFuncFam = atomFamily((ak: ArtistKey) =>
  atom(async (get) => {
    const artists = await get(allArtistsFunc);
    const artist = artists.get(ak);
    if (!artist) {
      Fail(ak, 'Unfound artist key');
    }
    return artist;
  }),
);

export const maybeArtistByKeyFuncFam = atomFamily((ak: ArtistKey) =>
  atom(async (get) =>
    ak.length === 0 ? null : await get(artistByKeyFuncFam(ak)),
  ),
);

export const albumKeyForSongKeyFuncFam = atomFamily((sk: SongKey) =>
  atom(async (get) =>
    sk.length > 0 ? (await get(songByKeyFuncFam(sk))).albumId : '',
  ),
);

export const artistStringFuncFam = atomFamily((artistList: ArtistKey[]) =>
  atom(async (get) => {
    if (artistList.length === 0) {
      return '';
    }
    const artists: string[] = (
      await Promise.all(
        artistList.map(async (ak) => {
          const art: Artist = await get(artistByKeyFuncFam(ak));
          return art ? art.name : '';
        }),
      )
    ).filter((a: string) => a.length > 0);
    if (artists.length === 1) {
      return artists[0];
    } else {
      const lastPart = ' & ' + (artists.pop() || 'OOPS!');
      return artists.join(', ') + lastPart;
    }
  }),
);

export const curSongsFunc = atom(async (get) => {
  const curList = await get(songListState);
  const songList: Song[] = [];
  for (const sk of curList) {
    try {
      const s = await get(songByKeyFuncFam(sk));
      songList.push(s);
    } catch (e) {
      Catch(e, `Error for SongKey '${sk}'`);
    }
  }
  return songList; // curList.map((sk: SongKey) => get(getSongByKeyState(sk)));
});

export const dataForSongFuncFam = atomFamily((sk: SongKey) =>
  atom(async (get): Promise<SongDescription> => {
    const res = { title: '', track: 0, artist: '', album: '', year: '' };

    if (sk.length === 0) {
      return res;
    }
    const song = await get(songByKeyFuncFam(sk));
    if (!song) {
      return res;
    }
    const title = song.title;
    const track = song.track;

    return { title, track, ...(await get(dataForAlbumFuncFam(song.albumId))) };
  }),
);

export const dataForSongListFuncFam = atomFamily((sks: SongKey[]) =>
  atom(
    async (get) =>
      await Promise.all(sks.map((sk: SongKey) => get(dataForSongFuncFam(sk)))),
  ),
);

export const maybeDataForSongFunc = atomFamily((ssk: SongKey[]) =>
  atom(async (get) => {
    if (ssk.length !== 1) {
      return null;
    }
    return await get(dataForSongFuncFam(ssk[0]));
  }),
);

export const dataForAlbumFuncFam = atomFamily((ak: AlbumKey) =>
  atom(async (get): Promise<AlbumDescriptionWithKey> => {
    const res = { artist: '', album: '', year: '', key: '' };
    if (!ak) {
      return res;
    }
    const album: Album = await get(albumByKeyFuncFam(ak));
    if (album) {
      res.album = album.title;
      res.year = album.year ? album.year.toString() : '';
    }
    res.key = ak;
    if (album.primaryArtists.length) {
      const maybeArtistName = await get(
        artistStringFuncFam(album.primaryArtists),
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
  }),
);

export const allAlbumsDataFunc = atom(async (get) => {
  const allAlbums = await get(allAlbumsFunc);
  return await Promise.all(
    [...allAlbums.keys()].map((l: AlbumKey) => get(dataForAlbumFuncFam(l))),
  );
});

export const SongListFromKey = atomFamily((data: MediaKey) =>
  atom(async (get): Promise<SongKey[]> => {
    if (data.length === 0) {
      return [];
    }
    if (isSongKey(data)) {
      return [data];
    }
    if (isAlbumKey(data)) {
      const alb = await get(albumByKeyFuncFam(data));
      return alb ? alb.songs : [];
    }
    if (isArtistKey(data)) {
      const art = await get(artistByKeyFuncFam(data));
      return art ? art.songs : [];
    }
    return [];
  }),
);

export const searchTermState = atom('');

export const metadataEditCountState = atom(0);

export const searchFuncFam = atomFamily((searchTerm: string) =>
  atom(async (get) => {
    const mdCount = get(metadataEditCountState);
    const res = await ipc.SearchWhole(searchTerm);
    return res || { songs: [], albums: [], artists: [] } || mdCount;
  }),
);

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
export const commonDataFuncFam = atomFamily((keys: SongKey[]) =>
  atom(async (get) => {
    const theSongsData: SongInfo[] = await Promise.all(
      keys.map(async (songKey) => {
        const song = await get(songByKeyFuncFam(songKey));
        const artists = await get(artistStringFuncFam(song.artistIds));
        const moreArtists = await get(artistStringFuncFam(song.secondaryIds));
        const album = await get(albumByKeyFuncFam(song.albumId));
        return { song, artists, moreArtists, album };
      }),
    );
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
  }),
);

export const filteredArtistsFunc = atom(async (get) => {
  const fullAlbums = await get(showArtistsWithFullAlbumsState);
  const minSongCount = await get(minSongCountForArtistListState);
  const artists = [...(await get(allArtistsFunc)).values()];
  if (fullAlbums) {
    const albums = await get(allAlbumsFunc);
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
});

export const ignoreItemsState = atomFromIpc(
  'IgnoreItemsState',
  isIgnoreItemArrayFn,
);

export const rescanInProgressState = atomFromMain(
  'RescanInProgress',
  isBoolean,
);
