import { RecoilValue, selector } from 'recoil';
import { logger } from '@freik/simplelogger';
import {
  SongListSort,
  SortWithArticles,
  SyncedLocations,
} from './SettingsAtoms';
import { GetSongSorter, sorter } from './Sorters';

import type {
  Artist,
  ArtistKey,
  Album,
  AlbumKey,
  Song,
  SongKey,
} from './MyStore';

import { selectorFamily } from 'recoil';
import { CallMain } from './MyWindow';

export type GetRecoilValue = <T>(recoilVal: RecoilValue<T>) => T;

const log = logger.bind('MusicDbAtoms');
// logger.enable('MusicDbAtoms')

export const AllSongs = selector<Map<SongKey, Song>>({
  key: 'AllSongs',
  get: async ({ get }): Promise<Map<SongKey, Song>> => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const locations = get(SyncedLocations.atom);
    log(locations.length);
    const res = await CallMain<void, Map<SongKey, Song>>('get-all-songs');
    return res || new Map<SongKey, Song>();
  },
});

export const SongByKey = selectorFamily<Song, SongKey>({
  key: 'SongByKey',
  get: (sk: SongKey) => ({ get }) => {
    const songs = get(AllSongs);
    const song = songs.get(sk);
    if (!song) throw new Error(sk);
    return song;
  },
});

export const AllSongKeys = selector<SongKey[]>({
  key: 'AllSongKeys',
  get: ({ get }) => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const songs = get(AllSongs);
    return [...songs.keys()];
  },
});

export const AllAlbums = selector<Map<AlbumKey, Album>>({
  key: 'AllAlbums',
  get: async ({ get }): Promise<Map<AlbumKey, Album>> => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const locations = get(SyncedLocations.atom);
    log(locations.length);
    const res = await CallMain<void, Map<AlbumKey, Album>>('get-all-albums');
    return res || new Map<AlbumKey, Album>();
  },
});

export const AlbumByKey = selectorFamily<Album, AlbumKey>({
  key: 'AlbumByKey',
  get: (ak: AlbumKey) => ({ get }) => {
    const Albums = get(AllAlbums);
    const album = Albums.get(ak);
    if (!album) throw new Error(ak);
    return album;
  },
});

export const AllAlbumKeys = selector<AlbumKey[]>({
  key: 'AllAlbumKeys',
  get: ({ get }) => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const albums = get(AllAlbums);
    return [...albums.keys()];
  },
});

export const AllArtists = selector<Map<ArtistKey, Artist>>({
  key: 'AllArtists',
  get: async ({ get }): Promise<Map<ArtistKey, Artist>> => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const locations = get(SyncedLocations.atom);
    log(locations.length);
    const res = await CallMain<void, Map<ArtistKey, Artist>>('get-all-artists');
    return res || new Map<ArtistKey, Artist>();
  },
});

export const ArtistByKey = selectorFamily<Artist, ArtistKey>({
  key: 'ArtistByKey',
  get: (ak: ArtistKey) => ({ get }) => {
    const Artists = get(AllArtists);
    const artist = Artists.get(ak);
    if (!artist) throw new Error(ak);
    return artist;
  },
});

export const AllArtistKeys = selector<ArtistKey[]>({
  key: 'AllArtistKeys',
  get: ({ get }) => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const artists = get(AllArtists);
    return [...artists.keys()];
  },
});

// This handles sorting the AllSongs list according to the
// user preferences
export const SortedSongsSelector = selector<SongKey[]>({
  key: 'SortedSongs',
  get: ({ get }): SongKey[] => {
    const songSort = get(SongListSort.atom);
    const allSongs = get(AllSongKeys);
    const articlesSort = get(SortWithArticles.atom);
    // TODO: I don't yet have the music DB available in Atoms
    // Gotta fix that before continuing...
    const comp: sorter = GetSongSorter(get, songSort, articlesSort);
    allSongs.sort(comp);
    return allSongs;
  },
});
