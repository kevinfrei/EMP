/* eslint-disable @typescript-eslint/naming-convention */
import { SongKey } from '@freik/media-core';
import { isArrayOfString, isBoolean } from '@freik/typechk';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { SongListFromKey } from './MusicDatabase';
import { atomFromIpc, atomWithMainStorage } from './Storage';

// const log = MakeLogger('Likes');
// const err = MakeError('Likes-err');

export const neverPlayHatesState = atomWithMainStorage(
  'neverPlayHates',
  true,
  isBoolean,
);

export const onlyPlayLikesState = atomWithMainStorage(
  'onlyPlayLikes',
  false,
  isBoolean,
);

const songLikeBackerState = atomFromIpc(
  'likedSongs',
  isArrayOfString,
  (strs) => new Set<string>(strs),
);

const songHateBackerState = atomFromIpc(
  'hatedSongs',
  isArrayOfString,
  (strs) => new Set<string>(strs),
);

export const isSongLikedFam = atomFamily((key: SongKey) =>
  atom(async (get) => (await get(songLikeBackerState)).has(key)),
);

export const isSongHatedFam = atomFamily((key: SongKey) =>
  atom(async (get) => (await get(songHateBackerState)).has(key)),
);

export const songLikeFuncFam = atomFamily((songKey: SongKey) =>
  atom(
    async (get) => {
      const likes = await get(songLikeBackerState);
      return likes.has(songKey);
    },
    async (get, set, newValue) => {
      const likes = await get(songLikeBackerState);
      const hates = await get(songHateBackerState);
      if (newValue !== likes.has(songKey)) {
        const copy = new Set(likes);
        if (newValue) {
          copy.add(songKey);
          if (hates.has(songKey)) {
            const hcopy = new Set(hates);
            hcopy.delete(songKey);
            await set(songHateBackerState, hcopy);
          }
        } else {
          copy.delete(songKey);
        }
        await set(songLikeBackerState, copy);
      }
    },
  ),
);

export const songHateFuncFam = atomFamily((songKey: SongKey) =>
  atom(
    async (get) => {
      const hates = await get(songHateBackerState);
      return hates.has(songKey);
    },
    async (get, set, newValue) => {
      const hates = await get(songHateBackerState);
      const likes = await get(songLikeBackerState);
      if (newValue !== hates.has(songKey)) {
        const copy = new Set(hates);
        if (newValue) {
          copy.add(songKey);
          if (likes.has(songKey)) {
            const lcopy = new Set(likes);
            lcopy.delete(songKey);
            await set(songLikeBackerState, lcopy);
          }
        } else {
          copy.delete(songKey);
        }
        await set(songHateBackerState, copy);
      }
    },
  ),
);

// 0 = neutral, 1 == like, 2 = hate, 3 = mixed
export const songLikeNumFromStringFuncFam = atomFamily((arg: string) =>
  atom(async (get) => {
    const songs = await get(SongListFromKey(arg));
    if (!songs) {
      return 0;
    }
    let likes = false;
    let hates = false;
    for (const songKey of songs) {
      if (await get(songLikeFuncFam(songKey))) {
        likes = true;
      }
      if (await get(songHateFuncFam(songKey))) {
        hates = true;
      }
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
