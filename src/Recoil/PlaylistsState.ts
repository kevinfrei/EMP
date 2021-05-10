/* eslint-disable @typescript-eslint/naming-convention */
import { Operations, Type } from '@freik/core-utils';
import { PlaylistName, SongKey } from '@freik/media-core';
import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import { CallMain, PostMain } from '../MyWindow';
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
      const playlistsString = await CallMain<string[], void>(
        'get-playlists',
        undefined,
        Type.isArrayOfString,
      );
      if (!playlistsString) {
        return new Set();
      }
      return new Set(playlistsString);
    } else {
      return new Set(backed);
    }
  },
  set: ({ set }, newValue) => {
    const data = Type.isSetOfString(newValue) ? [...newValue] : [];
    set(playlistNamesBackerState, data);
    void PostMain('set-playlists', data);
  },
});

const getPlaylistBackerFamily = atomFamily<SongKey[] | false, PlaylistName>({
  key: 'playlistFamilyBacker',
  default: false,
});

export const getPlaylistFamily = selectorFamily<SongKey[], PlaylistName>({
  key: 'PlaylistContents',
  get:
    (arg: PlaylistName) =>
    async ({ get }) => {
      const backed = get(getPlaylistBackerFamily(arg));
      if (backed === false) {
        const listStr = await CallMain(
          'load-playlist',
          arg,
          Type.isArrayOfString,
        );
        if (!listStr) {
          return [];
        }
        return listStr;
      } else {
        return backed;
      }
    },
  set:
    (name: PlaylistName) =>
    ({ set, get }, newValue) => {
      const names = get(playlistNamesState);
      if (!names.has(name)) {
        names.add(name);
        set(playlistNamesState, new Set(names));
      }
      const songs = Type.isArray(newValue) ? newValue : [];
      set(getPlaylistBackerFamily(name), songs);
      void PostMain('save-playlist', { name, songs });
    },
});

// This decides if the current playlist is something that can be 'saved'
// (Is it a playlist, and has it been modified)
export const saveableState = selector<boolean>({
  key: 'shouldSaveBeDisabled',
  get: ({ get }): boolean => {
    const curPlaylist = get(activePlaylistState);
    if (isPlaylist(curPlaylist)) {
      const theSongList = get(getPlaylistFamily(curPlaylist));
      const songList = get(songListState);
      return !Operations.ArraySetEqual(theSongList, songList);
    } else {
      // If it's not a playlist, you can't save it
      return false;
    }
  },
});
