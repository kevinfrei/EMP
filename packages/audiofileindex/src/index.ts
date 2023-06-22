import { Song } from '@freik/media-core';
export * from './AudioDatabase.js';
export {
  GetMediaInfo,
  IsFullMetadata,
  IsOnlyMetadata,
  MinimumMetadata,
} from './DbMetadata.js';
export { SearchResults } from './MusicSearch.js';

export type VAType = '' | 'ost' | 'va';
export type SongWithPath = Song & { path: string };
