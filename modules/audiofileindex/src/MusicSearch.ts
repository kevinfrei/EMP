import { AlbumKey, ArtistKey, SongKey } from '@freik/media-core';
import { Searchable } from '@freik/search';

export type MusicSearch = {
  songs: Searchable<SongKey>;
  albums: Searchable<AlbumKey>;
  artists: Searchable<ArtistKey>;
};

export type SearchResults = {
  songs: SongKey[];
  albums: AlbumKey[];
  artists: ArtistKey[];
};
/*
export function searchWholeWord(term?: string): Promise<SearchResults | void> {
  return (async (): Promise<SearchResults | void> => {
    const audioDatabase = await getAudioDatabase();
    if (term) {
      return audioDatabase.searchIndex(false, term);
    }
  })();
}

export function searchSubstring(term?: string): Promise<SearchResults | void> {
  return (async (): Promise<SearchResults | void> => {
    const audioDatabase = await getAudioDatabase();
    if (term) {
      return audioDatabase.searchIndex(true, term);
    }
  })();
}
*/
