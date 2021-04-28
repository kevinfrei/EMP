import { MakeError, MakeLogger, SeqNum, Type } from '@freik/core-utils';
import { AlbumKey, ArtistKey, FullMetadata, SongKey } from '@freik/media-core';
import { CallMain, InvokeMain, PostMain } from './MyWindow';

const log = MakeLogger('ipc');
const err = MakeError('ipc-err');

export type SearchResults = {
  songs: SongKey[];
  albums: AlbumKey[];
  artists: ArtistKey[];
};

export async function GetMediaInfo(
  key: SongKey,
): Promise<Map<string, string> | void> {
  return await CallMain<Map<string, string>, string>(
    'media-info',
    key,
    Type.isMapOfStrings,
  );
}

export async function SetMediaInfo(md: Partial<FullMetadata>): Promise<void> {
  await PostMain('set-media-info', md);
}

export async function ReadFromStorage(key: string): Promise<string | void> {
  return await InvokeMain('read-from-storage', key);
}

export async function WriteToStorage(key: string, data: string): Promise<void> {
  await InvokeMain('write-to-storage', [key, data]);
}

function isSearchResults(arg: any): arg is SearchResults | undefined {
  if (
    Type.isObjectNonNull(arg) &&
    Type.has(arg, 'songs') &&
    Type.has(arg, 'albums') &&
    Type.has(arg, 'artists')
  ) {
    return (
      Type.isArrayOfString(arg.albums) &&
      Type.isArrayOfString(arg.artists) &&
      Type.isArrayOfString(arg.songs)
    );
  }
  return arg === undefined;
}

export async function SearchWhole(
  searchTerm: string,
): Promise<SearchResults | void> {
  log('Searching for:' + searchTerm);
  const res = await CallMain('search', searchTerm, isSearchResults);
  if (res) {
    log('Got a search results blob:');
    log(res);
    return res;
  } else {
    log('Got no search results back');
  }
}

export type ListenKey = { key: string; id: string };
export type MessageHandler = (val: unknown) => void;

const sn = SeqNum('Listen');

// map of message names to map of id's to funtions
const listeners = new Map<string, Map<string, MessageHandler>>();

// Subscribe to the message
export function Subscribe(
  key: string,
  handler: (val: unknown) => void,
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
export function HandleMessage(message: unknown): void {
  // Walk the list of ID's to see if we've got anything with a format of:
  // { "id" : data }
  // This has an interesting side effect of letting the server process
  // send multiple "messages" in a single message:
  // { artists: ..., albums: ..., songs: ... } will invoke listeners for
  // all three of those 'messages'
  let handled = false;
  if (Type.isObjectNonNull(message)) {
    for (const id in message) {
      if (Type.isString(id) && Type.has(message, id)) {
        const listener = listeners.get(id);
        if (listener) {
          for (const handler of listener.values()) {
            handled = true;
            log(`Handling message: ${id}`);
            handler(message[id]);
          }
        }
      }
    }
  }
  if (!handled) {
    err('**********');
    err(`Unhandled message:`);
    err(message);
    err('**********');
  }
}
