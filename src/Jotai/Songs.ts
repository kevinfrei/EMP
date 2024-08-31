import { SongKey } from '@freik/media-core';
import { Fail } from '@freik/web-utils';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { musicLibraryState } from './MusicLibrary';

export const allSongsState = atom(
  async (get) => (await get(musicLibraryState)).songs,
);

export const maybeSongByKey = atomFamily((sk: SongKey) =>
  atom(async (get) => (await get(allSongsState)).get(sk)),
);

export const songByKey = atomFamily((sk: SongKey) =>
  atom(async (get) => {
    const song = await get(maybeSongByKey(sk));
    if (!song) {
      Fail(sk, 'Unfound song key');
    }
    return song;
  }),
);
