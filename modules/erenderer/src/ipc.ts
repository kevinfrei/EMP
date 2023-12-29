import { MakeLog } from '@freik/logger';
import SeqNum from '@freik/seqnum';
import {
  hasField,
  hasFieldType,
  isArray,
  isBoolean,
  isDefined,
  isObjectNonNull,
  isString,
} from '@freik/typechk';
import { IpcRendererEvent } from 'electron';
import { ElectronWindow, ListenKey, MessageHandler } from './types';

const { log, wrn } = MakeLog('@freik:elect-render-tools:ipc');

/**
 * @async
 * Read a key-value from Electron persistent storage
 *
 * @param key The key to read
 * @returns A promise that resolves to the value read (or void if none found)
 */
export async function ReadFromStorage(key: string): Promise<string | void> {
  return await CallMain('read-from-storage', key, isString);
}

/**
 * @async
 * Write a key-value pair to Electron persistent storage
 *
 * @param key The key to write
 * @param data The value to be written
 */
export async function WriteToStorage(key: string, data: string): Promise<void> {
  await InvokeMain('write-to-storage', [key, data]);
}

const sn = SeqNum('Listen');

// map of message names to map of id's to funtions
const listeners = new Map<string, Map<string, MessageHandler>>();

/**
 * This subscribes the `handler` to listen for messages coming from the
 * main process.
 *
 * @param key The message key identified to listen for
 * @param handler The function to invoke upon receipt of the message
 * @returns the key to use to unsubscribe
 */
export function Subscribe(
  key: string,
  handler: (val: unknown) => void,
): ListenKey {
  const theKey = { key, id: sn() };
  let handlerMap = listeners.get(key);
  if (!handlerMap) {
    handlerMap = new Map<string, MessageHandler>();
    listeners.set(key, handlerMap);
  }
  handlerMap.set(theKey.id, handler);
  return theKey;
}

/**
 * Unsubscribe from a particular message
 *
 * @param listenKey The key returned by {@link Subscribe}
 */
export function Unsubscribe(listenKey: ListenKey): void {
  const lstn = listeners.get(listenKey.key);
  if (lstn) {
    lstn.delete(listenKey.id);
  }
}

// Called when an async message comes in from the main process
// Ideally, these should just be subscribed to as part of an AtomEffect
function HandleMessage(message: unknown): void {
  // Walk the list of ID's to see if we've got anything with a format of:
  // { "id" : data }
  // This has an interesting side effect of letting the server process
  // send multiple "messages" in a single message:
  // { artists: ..., albums: ..., songs: ... } will invoke listeners for
  // all three of those 'messages'
  let state = 0;
  let handled = false;
  if (isObjectNonNull(message)) {
    state = 1;
    for (const field of Object.keys(message)) {
      if (hasField(message, field)) {
        state = 2;
        const lstn = listeners.get(field);
        if (lstn) {
          state = 3;
          for (const handler of lstn.values()) {
            handled = true;
            handler(message[field]);
          }
        }
      }
    }
  }
  if (!handled) {
    wrn('**********');
    wrn('Unhandled message (state', state, ')');
    wrn(message);
    wrn('**********');
  }
}

declare let window: ElectronWindow;

export function listener(_event: IpcRendererEvent, data: unknown) {
  if (
    isArray(data) &&
    isObjectNonNull(data[0]) &&
    hasFieldType(data[0], 'message', isObjectNonNull)
  ) {
    log('*** Properly formed async message received:');
    log(data[0]);
    HandleMessage(data[0].message);
  } else {
    wrn('>>> Async malformed message begin');
    wrn(data);
    wrn('<<< Async malformed message end');
  }
}

/** @ignore */
export function InitialWireUp(): () => void {
  if (window.electronConnector !== undefined) {
    log('ipc is being set up!');
    // Set up listeners for any messages that we might want to asynchronously
    // send from the main process
    window.electronConnector.ipc.on('async-data', listener);
    // get the isDev value (because electron-is-dev doesn't work in the renderer)
    CallMain('is-dev', '', isBoolean)
      .then((isdev) => {
        if (window.electronConnector !== undefined && isBoolean(isdev)) {
          window.electronConnector.isDev = isdev;
        }
      })
      .catch(wrn);
  } else {
    wrn('ipc is not configured');
    wrn('You should call @freik/electron-renderer: InitRender()');
    wrn('Probably from within your static/renderer.ts file');
  }
  return () =>
    window.electronConnector?.ipc.removeListener('async-data', listener);
}

/**
 * @async
 * Invoke a remote function with no type checking or translation.
 * You probably want to use {@link CallMain} or {@link PostMain} instead.
 *
 * @template T The (implied) type of the key to send
 *
 * @param channel The channel to send a message to
 * @param key The key to communicate to the message (if any)
 * @returns A promise that resolves to the result of the RPC
 */
export async function InvokeMain<T>(
  channel: string,
  key?: T,
): Promise<unknown> {
  let result;
  if (!window.electronConnector) throw Error('nope');
  if (isDefined(key)) {
    log(`Invoking main("${channel}", "...")`);
    result = (await window.electronConnector.ipc.invoke(
      channel,
      key,
    )) as unknown;
    log(`Invoke main ("${channel}" "...") returned:`);
  } else {
    log(`Invoking main("${channel}")`);
    result = (await window.electronConnector.ipc.invoke(channel)) as unknown;
    log(`Invoke main ("${channel}") returned:`);
  }
  log(result);
  return result;
}

export function SendMain<T>(channel: string, key?: T): void {
  void InvokeMain(channel, key);
}

/**
 * @async
 * Call a remote function with type checking on the return value.
 * If you have no return type, use {@link PostMain} instead.
 *
 * @param channel The channel to send a message to
 * @param key The key to communicat to the message
 * @param typecheck The typecheck function to validate the return type R
 * @returns A promise that resolves to the typechecked return value of the RPC
 */
export async function CallMain<R, T>(
  channel: string,
  key: T,
  typecheck: (val: unknown) => val is R,
): Promise<R | void> {
  const result = await InvokeMain(channel, key);
  if (typecheck(result)) {
    return result;
  }
  wrn(
    `CallMain(${channel}, <T>, ${typecheck.name}(...)) result failed typecheck`,
    result,
  );
}

/**
 * @async
 * Call a remote function with validation of a void result.
 *
 * @param channel The channel to send a message to
 * @param key The key to communicate to the message
 * @returns A promise that resolves when the RPC has returned
 */
export async function PostMain<T>(channel: string, key?: T): Promise<void> {
  return CallMain(channel, key, (a: unknown): a is void => true);
}
