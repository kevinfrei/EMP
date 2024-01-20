/* eslint-disable @typescript-eslint/naming-convention */
import { IpcId, StorageKey } from '@freik/emp-shared';
import { SongKey } from '@freik/media-core';
import { isArrayOfString, isBoolean } from '@freik/typechk';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { atomFromIpc, atomWithMainStorage } from './Helpers';
import { songListFromKeyAtomFam } from './MusicDatabase';

// const log = MakeLogger('Likes');
// const err = MakeError('Likes-err');

export const neverPlayHatesAtom = atomWithMainStorage(
  StorageKey.NeverPlayHates,
  true,
  isBoolean,
);

export const onlyPlayLikesAtom = atomWithMainStorage(
  StorageKey.OnlyPlayLikes,
  false,
  isBoolean,
);

const songLikeBackerState = atomFromIpc(
  IpcId.GetLikes,
  isArrayOfString,
  (strs) => new Set<string>(strs),
);

const songHateBackerAtom = atomFromIpc(
  IpcId.GetHates,
  isArrayOfString,
  (strs) => new Set<string>(strs),
);

export const isSongLikedAtomFam = atomFamily((key: SongKey) =>
  atom(async (get) => (await get(songLikeBackerState)).has(key)),
);

export const isSongHatedAtomFam = atomFamily((key: SongKey) =>
  atom(async (get) => (await get(songHateBackerAtom)).has(key)),
);

export const songLikeAtomFam = atomFamily((songKey: SongKey) =>
  atom(
    async (get) => {
      const likes = await get(songLikeBackerState);
      return likes.has(songKey);
    },
    async (get, set, newValue) => {
      const likes = await get(songLikeBackerState);
      const hates = await get(songHateBackerAtom);
      if (newValue !== likes.has(songKey)) {
        const copy = new Set(likes);
        if (newValue) {
          copy.add(songKey);
          if (hates.has(songKey)) {
            const hcopy = new Set(hates);
            hcopy.delete(songKey);
            await set(songHateBackerAtom, hcopy);
          }
        } else {
          copy.delete(songKey);
        }
        await set(songLikeBackerState, copy);
      }
    },
  ),
);

export const songHateAtomFam = atomFamily((songKey: SongKey) =>
  atom(
    async (get) => {
      const hates = await get(songHateBackerAtom);
      return hates.has(songKey);
    },
    async (get, set, newValue) => {
      const hates = await get(songHateBackerAtom);
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
        await set(songHateBackerAtom, copy);
      }
    },
  ),
);

// 0 = neutral, 1 == like, 2 = hate, 3 = mixed
export const songLikeNumFromStringAtomFam = atomFamily((arg: string) =>
  atom(async (get) => {
    const songs = await get(songListFromKeyAtomFam(arg));
    if (!songs) {
      return 0;
    }
    let likes = false;
    let hates = false;
    for (const songKey of songs) {
      if (await get(songLikeAtomFam(songKey))) {
        likes = true;
      }
      if (await get(songHateAtomFam(songKey))) {
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
