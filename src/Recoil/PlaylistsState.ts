/* eslint-disable @typescript-eslint/naming-convention */
import {
  Comparisons,
  FTON,
  PlaylistName,
  SongKey,
  Type,
} from '@freik/core-utils';
import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import { InvokeMain } from '../MyWindow';
import { isPlaylist } from '../Tools';
import { activePlaylistState, songListState } from './Local';

// Stuff for playlists

const playlistNamesBackerState = atom<string[] | false>({
  key: 'playlistNames-backer',
  default: false,
});

export const playlistNamesState = selector<Set<PlaylistName>>({
  key: 'PlaylistNames',
  get: async ({ get }) => {
    const backed = get(playlistNamesBackerState);
    if (backed === false) {
      const playlistsString = await InvokeMain('get-playlists');
      if (!playlistsString) {
        return new Set();
      }
      const parsed = FTON.parse(playlistsString);
      const strs = FTON.arrayOfStrings(parsed);
      return new Set(strs || []);
    } else {
      return new Set(backed);
    }
  },
  set: async ({ set }, newValue) => {
    const data = Type.isSetOf(newValue, Type.isString) ? [...newValue] : [];
    set(playlistNamesBackerState, data);
    await InvokeMain('set-playlists', FTON.stringify(data));
  },
});

const getPlaylistBackerState = atomFamily<SongKey[] | false, PlaylistName>({
  key: 'playlistFamilyBacker',
  default: false,
});

export const getPlaylistState = selectorFamily<SongKey[], PlaylistName>({
  key: 'PlaylistContents',
  get: (arg: PlaylistName) => async ({ get }) => {
    const backed = get(getPlaylistBackerState(arg));
    if (backed === false) {
      const listStr = await InvokeMain('load-playlist', arg);
      if (!listStr) {
        return [];
      }
      const parse = FTON.parse(listStr);
      return Type.isArrayOf(parse, Type.isString) ? parse : [];
    } else {
      return backed;
    }
  },
  set: (name: PlaylistName) => async ({ set, get }, newValue) => {
    const names = get(playlistNamesState);
    if (!names.has(name)) {
      names.add(name);
      set(playlistNamesState, new Set(names));
    }
    const songs = Type.isArray(newValue) ? newValue : [];
    set(getPlaylistBackerState(name), songs);
    await InvokeMain('save-playlist', FTON.stringify({ name, songs }));
  },
});

// This decides if the current playlist is something that can be 'saved'
// (Is it a playlist, and has it been modified)
export const saveableState = selector<boolean>({
  key: 'shouldSaveBeDisabled',
  get: ({ get }): boolean => {
    const curPlaylist = get(activePlaylistState);
    if (isPlaylist(curPlaylist)) {
      const theSongList = get(getPlaylistState(curPlaylist));
      const songList = get(songListState);
      return !Comparisons.ArraySetEqual(theSongList, songList);
    } else {
      // If it's not a playlist, you can't save it
      return false;
    }
  },
});
