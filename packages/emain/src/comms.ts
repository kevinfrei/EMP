import { MakeLog } from '@freik/logger';
import { chk2TupleOf, isString } from '@freik/typechk';
import { ProtocolRequest, ProtocolResponse, app, ipcMain } from 'electron';
import { IpcMainInvokeEvent } from 'electron/main';
import { Persistence } from './persist';
import { ShowOpenDialog, isOpenDialogOptions } from './shell';
import { getMainWindow } from './win';

const { log, err } = MakeLog('@freik:electron-main-tools:comms');

/**
 * The type of a "channel handler", used by {@link registerChannel}
 */
export type Handler<R, T> = (arg: T) => Promise<R | void>;

/**
 * Registers with electron's
 * [ipcMain.handle](https://www.electronjs.org/docs/latest/api/ipc-main#ipcmainhandlechannel-listener)
 * a function that takes a mandatory parameter and returns *string* data
 * untouched. It also requires a checker to ensure the data is properly typed
 *
 * @param key The id to register a listener for
 * @param handler the function that handles the data
 * @param checker a Type Check function for return type of the channel T
 * @returns void
 */
export function registerChannel<R, T>(
  key: string,
  handler: Handler<R, T>,
  checker: (v: unknown) => v is T,
): void {
  ipcMain.handle(
    key,
    async (_event: IpcMainInvokeEvent, arg: unknown): Promise<R | void> => {
      if (checker(arg)) {
        log(`Received ${key} message: handling`);
        return await handler(arg);
      }
      err(`Invalid argument type to ${key} handler`);
      err(arg);
    },
  );
}

/**
 * Read a value from persistence by name, returning it's unprocessed contents
 * @async
 *
 * @param name the name of the value to read
 * @return Promise resolved to the raw string contents of the value
 */
export async function readFromStorage(name?: string): Promise<string> {
  if (!name) return '';
  try {
    log(`readFromStorage(${name})`);
    const value = await Persistence.getItemAsync(name);
    log(`Sending ${name} response:`);
    log(value);
    return value || '';
  } catch (e) {
    err(`error from readFromStorage(${name})`);
    err(e);
  }
  return '';
}

/**
 * Write a value to persistence by name.
 * @async
 *
 * @param keyValuePair - The key:value string to write
 */
export async function writeToStorage([key, value]: [
  string,
  string,
]): Promise<void> {
  try {
    // First, split off the key name:
    log(`writeToStorage(${key} : ${value})`);
    // Push the data into the persistence system
    await Persistence.setItemAsync(key, value);
    log(`writeToStorage(${key}...) completed`);
  } catch (e) {
    err(`error from writeToStorage([${key}, ${value}])`);
    err(e);
  }
}

/**
 * Send arbitrary data to the main window
 *
 * @param channel The name of the channel
 * @param data The arbitrary data to send
 */
export function SendToMain(channel: string, ...data: unknown[]): void {
  log('Sending to main:');
  const mainWindow = getMainWindow();
  if (mainWindow && mainWindow.webContents) {
    log('Channel:');
    log(channel);
    log('Data:');
    log(data);
    mainWindow.webContents.send(channel, data);
  }
}

async function wwwIsDev(): Promise<boolean> {
  return Promise.resolve(!app.isPackaged);
}

/**
 * Send a message to the main window. This pairs with Handle in the
 * elect-render-utils library
 *
 * @param message The (flattenable) message to send.
 */
export function AsyncSend(message: unknown): void {
  SendToMain('async-data', { message });
}

const isKeyValue = chk2TupleOf<string, string>(isString, isString);

/**
 * Call this before starting your window. This will register handlers for
 * the simple read-from/write-to storage calls that elect-render-utils expects
 */
export function SetupDefault(): void {
  // These are the general "just asking for something to read/written to disk"
  // functions. Media Info, Search, and MusicDB stuff needs a different handler
  // because they don't just read/write to disk.
  registerChannel('read-from-storage', readFromStorage, isString);
  registerChannel('write-to-storage', writeToStorage, isKeyValue);
  registerChannel('show-open-dialog', ShowOpenDialog, isOpenDialogOptions);
  registerChannel('is-dev', wwwIsDev, (a: unknown): a is void => true);
}

export type Registerer<T> = (
  scheme: string,
  handler: (
    request: ProtocolRequest,
    callback: (response: T | ProtocolResponse) => void,
  ) => void,
) => boolean;

const e404 = { error: 404 };

/**
 * Helper to check URL's & transition to async functions
 *
 * @param type The 'header' of the protocol. "pix://foo/" for example
 * @param registerer The type of protocol registration function to use.
 * [protocol.registerBufferProtocol](https://www.electronjs.org/docs/latest/api/protocol#protocolregisterfileprotocolscheme-handler)
 * for example. It must match the response type appropriately!
 * @param processor The function that will process the protocol request
 * @param defaultValue The (optional) default return value (Error 404)
 */
export function registerOldProtocolHandler<ResponseType>(
  type: string,
  registerer: Registerer<ResponseType>,
  processor: (
    req: ProtocolRequest,
    trimmedUrl: string,
  ) => Promise<ProtocolResponse | ResponseType>,
  defaultValue: ProtocolResponse | ResponseType = e404,
) {
  const protName = type.substring(0, type.indexOf(':'));
  log(`Protocol ${type} (${protName})`);
  const handler = async (req: ProtocolRequest) => {
    if (!req.url) {
      err('Request with no URL');
      return { error: -324 };
    }
    if (req.url.startsWith(type)) {
      log(`Processing request ${type}`);
      const res = await processor(req, req.url.substring(type.length));
      log('Returning:');
      log(res);
      return res;
    }
    err('URL does not fully match type');
    err('Got ');
    err(req.url);
    err('Expected');
    err(type);
    return defaultValue;
  };
  registerer(protName, (req, callback) => {
    handler(req)
      .then(callback)
      .catch((reason) => {
        log('error');
        log(reason);
      });
  });
}
