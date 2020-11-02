import { FTON, FTONData, MakeLogger, SeqNum, Type } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-utils';
import { InvokeMain } from './Tools';

const log = MakeLogger('ipc', true);

export type SearchResults = {
  songs: SongKey[];
  albums: AlbumKey[];
  artists: ArtistKey[];
};

export async function GetAllSongs(): Promise<Map<SongKey, Song> | void> {
  const blob = await InvokeMain('get-all-songs');
  if (blob) {
    return FTON.parse(blob) as Map<SongKey, Song>;
  }
}

export async function GetAllAlbums(): Promise<Map<AlbumKey, Album> | void> {
  const blob = await InvokeMain('get-all-albums');
  if (blob) {
    return FTON.parse(blob) as Map<AlbumKey, Album>;
  }
}

export async function GetAllArtsists(): Promise<Map<ArtistKey, Artist> | void> {
  const blob = await InvokeMain('get-all-artists');
  if (blob) {
    return FTON.parse(blob) as Map<ArtistKey, Artist>;
  }
}

export async function GetAllPlaylists(): Promise<Map<
  string,
  SongKey[]
> | void> {
  const blob = await InvokeMain('get-playlists');
  if (blob) {
    return FTON.parse(blob) as Map<string, SongKey[]>;
  }
}

export async function GetMediaInfo(
  key: SongKey,
): Promise<Map<string, string> | void> {
  const blob = await InvokeMain('get-media-info', key);
  if (blob) {
    const res = FTON.parse(blob);
    if (Type.isMapOf(res, Type.isString, Type.isString)) {
      return res;
    }
  }
}

export async function ReadFromStorage(key: string): Promise<string | void> {
  return await InvokeMain('read-from-storage', key);
}

export async function WriteToStorage(key: string, data: string): Promise<void> {
  await InvokeMain('write-to-storage', key + ':' + data);
}

export async function SearchWhole(
  searchTerm: string,
): Promise<SearchResults | void> {
  log('Searching for:' + searchTerm);
  const blob = await InvokeMain('search', searchTerm);
  if (blob) {
    log('Got a blob of size: ' + blob.length.toString());
    return FTON.parse(blob) as SearchResults;
  } else {
    log('Got no blob back');
  }
}

export type ListenKey = { key: string; id: string };
export type MessageHandler = (val: FTONData) => void;

const sn = SeqNum('Listen');

// map of message names to map of id's to funtions
const listeners = new Map<string, Map<string, MessageHandler>>();

// Subscribe to the message
export function Subscribe(
  key: string,
  handler: (val: FTONData) => void,
): ListenKey {
  const theKey = { key, id: sn() };
  let handlerMap: Map<string, MessageHandler> | void = listeners.get(key);
  if (!handlerMap) {
    handlerMap = new Map<string, MessageHandler>();
    listeners.set(key, handlerMap);
  }
  handlerMap.set(theKey.id, handler);
  return theKey;
}

// Remove listener from the message
export function Unsubscribe(listenKey: ListenKey): void {
  const listener = listeners.get(listenKey.key);
  if (listener) {
    listener.delete(listenKey.id);
  }
}

// Called when an async message comes in from the main process
// Ideally, these should just be subscribed to as part of an AtomEffect
export function HandleMessage(message: FTONData): void {
  // Walk the list of ID's to see if we've got anything with a format of:
  // { "id" : data }
  // This has an interesting side effect of letting the server process
  // send multiple "messages" in a single message:
  // { artists: ..., albums: ..., songs: ... } will invoke listeners for
  // all three of those 'messages'
  let handled = false;
  for (const [id, map] of listeners) {
    if (Type.has(message, id)) {
      for (const handler of map.values()) {
        handled = true;
        log(`Handling message: ${id}`);
        handler(message[id]);
      }
    }
  }
  if (!handled) {
    log('**********');
    log(`Unhandled message:`);
    log(message);
    log('**********');
  }
}
