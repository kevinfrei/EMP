import { StorageId } from '@freik/emp-shared';
import {
  AlbumKey,
  ArtistKey,
  isAlbumKey,
  isArtistKey,
  SongKey,
} from '@freik/media-core';
import { isArrayOfString, isBoolean } from '@freik/typechk';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import {
  atomWithMainStorage,
  atomWithTranslatedStorageInMain,
} from './Storage';

// const log = MakeLogger('Likes');
// const err = MakeError('Likes-err');

export const neverPlayHatesState = atomWithMainStorage(
  StorageId.NeverPlayHates,
  true,
  isBoolean,
);

export const onlyPlayLikesState = atomWithMainStorage(
  StorageId.OnlyPlayLikes,
  false,
  isBoolean,
);

const songLikeBackerState = atomWithTranslatedStorageInMain(
  StorageId.LikedSongs,
  new Set<SongKey>(),
  isArrayOfString,
  (val: Set<string>) => [...val],
  (val: string[]) => new Set<string>(val),
);

const songHateBackerState = atomWithTranslatedStorageInMain(
  StorageId.HatedSongs,
  new Set<SongKey>(),
  isArrayOfString,
  (val: Set<string>) => [...val],
  (val: string[]) => new Set<string>(val),
);

export const isSongLikedFam = atomFamily((key: SongKey) =>
  atom(
    async (get) => (await get(songLikeBackerState)).has(key),
    async (get, set, newVal: boolean) => {
      const likeSet = await get(songLikeBackerState);
      if (likeSet.has(key) === newVal) {
        return;
      }
      const newLikes = new Set(likeSet);
      if (newVal) {
        newLikes.add(key);
        const hateSet = await get(songHateBackerState);
        if (hateSet.has(key)) {
          const newHates = new Set(hateSet);
          newHates.delete(key);
          set(songHateBackerState, newHates);
        }
      } else {
        newLikes.delete(key);
      }
      set(songLikeBackerState, newLikes);
    },
  ),
);

export const isSongHatedFam = atomFamily((key: SongKey) =>
  atom(
    async (get) => (await get(songHateBackerState)).has(key),
    async (get, set, newVal: boolean) => {
      const hateSet = await get(songHateBackerState);
      if (hateSet.has(key) === newVal) {
        return;
      }
      const newHates = new Set(hateSet);
      if (newVal) {
        newHates.add(key);
        const likeSet = await get(songLikeBackerState);
        if (likeSet.has(key)) {
          const newLikes = new Set(likeSet);
          newLikes.delete(key);
          set(songLikeBackerState, newLikes);
        }
      } else {
        newHates.delete(key);
      }
      set(songHateBackerState, newHates);
    },
  ),
);

// JODO: This doesn't handle song lists. Need to get them from the incomplete media interface
// 0 = neutral, 1 == like, 2 = hate, 3 = mixed
export const songListLikeNumberFromStringFam = atomFamily(
  (key: AlbumKey | ArtistKey | SongKey) =>
    atom(async (get) => {
      if (isAlbumKey(key) || isArtistKey(key)) {
        // JODO: Fix this to get the song list from the key
        return 0;
      }
      const songs = [key];
      let likes = false;
      let hates = false;
      for (const sk of songs) {
        if (!likes) likes = await get(isSongLikedFam(sk));
        if (!hates) hates = await get(isSongHatedFam(sk));
        if (likes && hates) {
          break;
        }
      }
      if (likes === hates) {
        return likes ? 3 : 0;
      } else {
        return likes ? 1 : 2;
      }
    }),
);
