/* eslint-disable @typescript-eslint/naming-convention */
import { Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-core';
import { atom, selectorFamily } from 'recoil';
import {
  bidirectionalSyncWithTranslateEffect,
  syncWithMainEffect,
} from './helpers';
import { songListFromKeyFamily } from './ReadWrite';

// const log = MakeLogger('Likes');
// const err = MakeError('Likes-err');

export const neverPlayHatesState = atom<boolean>({
  key: 'neverPlayHates',
  default: true,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

export const onlyPlayLikesState = atom<boolean>({
  key: 'onlyPlayLikes',
  default: false,
  effects_UNSTABLE: [syncWithMainEffect<boolean>()],
});

const songLikeBackerState = atom<Set<SongKey>>({
  key: 'likedSongs',
  default: new Set<SongKey>(),
  effects_UNSTABLE: [
    bidirectionalSyncWithTranslateEffect<Set<SongKey>>(
      (val: Set<string>) => [...val],
      (val: unknown) =>
        Type.isArrayOfString(val) ? new Set<string>(val) : new Set<string>(),
      false,
    ),
  ],
});

export const songLikeFamily = selectorFamily<boolean, SongKey>({
  key: 'songLikeState',
  get:
    (arg: SongKey) =>
    ({ get }) => {
      const likes = get(songLikeBackerState);
      return likes.has(arg);
    },
  set:
    (arg: SongKey) =>
    ({ get, set }, newValue) => {
      const likes = get(songLikeBackerState);
      const hates = get(songHateBackerState);
      if (newValue !== likes.has(arg)) {
        const copy = new Set(likes);
        if (newValue) {
          copy.add(arg);
          if (hates.has(arg)) {
            const hcopy = new Set(hates);
            hcopy.delete(arg);
            set(songHateBackerState, hcopy);
          }
        } else {
          copy.delete(arg);
        }
        set(songLikeBackerState, copy);
      }
    },
});

const songHateBackerState = atom<Set<SongKey>>({
  key: 'hatedSongs',
  default: new Set<SongKey>(),
  effects_UNSTABLE: [
    bidirectionalSyncWithTranslateEffect<Set<SongKey>>(
      (val: Set<string>) => [...val],
      (val: unknown) =>
        Type.isArrayOfString(val) ? new Set<string>(val) : new Set<string>(),
      false,
    ),
  ],
});

export const songHateFamily = selectorFamily<boolean, SongKey>({
  key: 'songHateState',
  get:
    (arg: SongKey) =>
    ({ get }) => {
      const hates = get(songHateBackerState);
      return hates.has(arg);
    },
  set:
    (arg: SongKey) =>
    ({ get, set }, newValue) => {
      const hates = get(songHateBackerState);
      const likes = get(songLikeBackerState);
      if (newValue !== hates.has(arg)) {
        const copy = new Set(hates);
        if (newValue) {
          copy.add(arg);
          if (likes.has(arg)) {
            const lcopy = new Set(likes);
            lcopy.delete(arg);
            set(songLikeBackerState, lcopy);
          }
        } else {
          copy.delete(arg);
        }
        set(songHateBackerState, copy);
      }
    },
});

// 0 = neutral, 1 == like, 2 = hate, 3 = mixed
export const songLikeNumFromStringFamily = selectorFamily<number, string>({
  key: 'songLikeNumFromKey',
  get:
    (arg: string) =>
    ({ get }) => {
      const songs = get(songListFromKeyFamily(arg));
      if (!songs) {
        return 0;
      }
      let likes = false;
      let hates = false;
      songs.forEach((songKey) => {
        if (get(songLikeFamily(songKey))) {
          likes = true;
        }
        if (get(songHateFamily(songKey))) {
          hates = true;
        }
      });
      if (likes === hates) {
        return likes ? 3 : 0;
      } else {
        return likes ? 1 : 2;
      }
    },
});
