import { Song } from "@freik/media-core";

export type VAType = '' | 'ost' | 'va';
export type SongWithPath = Song & { path: string };
