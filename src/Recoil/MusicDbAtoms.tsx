import { RecoilValue, selector, atom } from 'recoil';
import { Logger } from '@freik/core-utils';
import {
  SongListSort,
  SortWithArticles,
  SyncedLocations,
} from './SettingsAtoms';
import { GetSongSorter, sorter } from '../Sorters';
import { selectorFamily } from 'recoil';
import * as ipc from '../ipc';

import type {
  Artist,
  ArtistKey,
  Album,
  AlbumKey,
  Song,
  SongKey,
} from '../MyStore';

export type GetRecoilValue = <T>(recoilVal: RecoilValue<T>) => T;

const log = Logger.bind('MusicDbAtoms');
// Logger.enable('MusicDbAtoms')

/*
type Collection<K, T> = {
  All: T[];
  ByKey: Map<K, T>;
  Keys: K[];
};
const Songs: Collection<SongKey, Song> = {
  All: [],
  ByKey: new Map<SongKey, Song>(),
  Keys: [],
};*/

export const AllSongs = selector<Map<SongKey, Song>>({
  key: 'AllSongs',
  get: async ({ get }): Promise<Map<SongKey, Song>> => {
    // Get the locations to make sure that if they change,
    // we get the new song list
    const locations = get(SyncedLocations.atom);
    log(locations.length);
    const res = await ipc.GetAllSongs();
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
    const res = await ipc.GetAllAlbums();
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

export const MaybeAlbumByKey = selectorFamily<Album | null, AlbumKey>({
  key: 'MaybeAlbumByKey',
  get: (ak: AlbumKey) => ({ get }) => {
    if (ak.length === 0) return null;
    return get(AlbumByKey(ak));
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
    const res = await ipc.GetAllArtsists();
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


export const MaybeArtistByKey = selectorFamily<Album | null, ArtistKey>({
  key: 'MaybeArtistByKey',
  get: (ak: ArtistKey) => ({ get }) => {
    if (ak.length === 0) return null;
    return get(ArtistByKey(ak));
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

export const NowPlayingAtom = atom<string>({
  key: 'nowPlaying',
  default: '',
});

export const PlaylistsAtom = atom<Map<string, SongKey[]>>({
  key: 'Playlists',
  default: new Map<string, SongKey[]>(),
});

export const SongListAtom = atom<SongKey[]>({
  key: 'currentSongList',
  default: [],
});

export const CurrentIndexAtom = atom<number>({
  key: 'currentIndex',
  default: -1,
});
