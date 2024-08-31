import { Artist, ArtistKey } from '@freik/media-core';
import { Fail } from '@freik/web-utils';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { musicLibraryState } from './MusicLibrary';

export const allArtistsState = atom(async (get) => {
  return (await get(musicLibraryState)).artists;
});

export const maybeArtistByKey = atomFamily((ak: ArtistKey) =>
  atom(async (get) => (await get(allArtistsState)).get(ak)),
);

export const artistByKey = atomFamily((ak: ArtistKey) =>
  atom(async (get) => {
    const artist = await get(maybeArtistByKey(ak));
    if (!artist) {
      Fail(ak, 'Unfound artist key');
    }
    return artist;
  }),
);

export const artistStringStateFamily = atomFamily((artistList: ArtistKey[]) =>
  atom(async (get): Promise<string> => {
    if (artistList.length === 0) {
      return '';
    }
    const artists: string[] = (
      await Promise.all(
        artistList.map(async (ak) => {
          const art: Artist = await get(artistByKey(ak));
          return art ? art.name : '';
        }),
      )
    ).filter((a: string) => a.length > 0);
    if (artists.length === 1) {
      return artists[0];
    } else {
      const lastPart = ' & ' + (artists.pop() || ''); // asssert :)
      return artists.join(', ') + lastPart;
    }
  }),
);
