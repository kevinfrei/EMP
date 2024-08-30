import { atom } from 'jotai';
import { MusicLibrary } from '../MusicLibrarySchema';

const jodoLib: MusicLibrary = {
  songs: new Map(),
  artists: new Map(),
  albums: new Map(),
};

export const musicLibraryState = atom(jodoLib);
