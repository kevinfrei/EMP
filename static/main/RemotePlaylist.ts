import { FTON, FTONData, Logger } from '@freik/core-utils';
import { promises } from 'fs';
import { PlaylistName, SongKey } from '../../src/DataSchema';
import { getGeneral, setGeneral } from './Communication';

import * as persist from './persist';

const log = Logger.bind('RemotePlaylist');

// The core design for playlists is a set of unique names
// and then each name has a set of SongKey's
// It's a bit more 'chatty' because I don't want the API to require
// a full file rewrite when just one playlist changes

export async function GetPlaylistNames(): Promise<PlaylistName[]> {
  try {
    const list = await persist.getItemAsync('playlist-names');
    if (list) {
      const parsed = FTON.arrayOfStrings(FTON.parse(list));
      return parsed || [];
    }
  } catch (e) {
    log('Error during Get Playlists:');
    log(e);
  }
  return [];
}

async function getPlaylistsSet() {
  const playlists = await GetPlaylistNames();
  const playlistsSet = new Set<PlaylistName>(
    playlists.map((v: string) => v.toLowerCase()),
  );
  return { playlistsSet, playlists };
}

export async function GetPlaylist(name?: string): Promise<string> {
  const { playlistsSet } = await getPlaylistsSet();
  if (!playlistsSet.has(name.toLowerCase())) {
    return '';
  }
  return await getGeneral('-PL-' + name.toLowerCase());
}

export async function SavePlaylist(nameAndList?: string): Promise<void> {
  if (!nameAndList) return;
  const pos = nameAndList.indexOf(':');
  const name = nameAndList.substring(0, pos);
  const list = nameAndList.substring(pos + 1);
  // TODO: Validate that the list is a semicolon separated list of valid
  // songkeys

  // Save the value
  await setGeneral(`-PL-${name.toLowerCase()}:${list}`);
  // Check to see if the playlist name is new, if so, add it
  const { playlistsSet, playlists } = await getPlaylistsSet();
  if (!playlistsSet.has(name.toLowerCase())) {
    playlists.push(name);
    await persist.setItemAsync('playlist-names', FTON.stringify(playlists));
  }
}
