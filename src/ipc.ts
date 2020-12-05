import {
  AlbumKey,
  ArtistKey,
  FTON,
  FTONData,
  FullMetadata,
  MakeError,
  MakeLogger,
  SeqNum,
  SongKey,
  Type,
} from '@freik/core-utils';
import { InvokeMain } from './MyWindow';

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
  const blob = await InvokeMain('get-media-info', key);
  if (blob) {
    const res = FTON.parse(blob);
    if (Type.isMapOf(res, Type.isString, Type.isString)) {
      return res;
    }
  }
}

export async function SetMediaInfo(md: Partial<FullMetadata>): Promise<void> {
  await InvokeMain('set-media-info', FTON.stringify(md));
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
