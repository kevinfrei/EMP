// This is for getting at "global" stuff from the window object
import { FTON, MakeError, MakeLogger, Type } from '@freik/core-utils';
import { IpcRenderer } from 'electron';
import { IpcRendererEvent, OpenDialogSyncOptions } from 'electron/main';
import { HandleMessage } from './ipc';

const log = MakeLogger('MyWindow');
const err = MakeError('MyWindow-err');

/*
 * "Window" stuff goes here
 */

interface MyWindow extends Window {
  ipc: IpcRenderer | undefined;
  remote: Electron.Remote | undefined;
  isDev: boolean | undefined;
  initApp: undefined | (() => void);
  ipcSet: boolean | undefined;
}

declare let window: MyWindow;

export function ShowOpenDialog(
  options: OpenDialogSyncOptions,
): string[] | undefined {
  return window.remote!.dialog.showOpenDialogSync(options);
}
export function SetInit(func: () => void): void {
  window.initApp = func;
}

export function InitialWireUp(): void {
  if (!window.ipcSet) {
    window.ipcSet = true;

    // Set up listeners for any messages that we might want to asynchronously
    // send from the main process
    window.ipc?.on('async-data', (event: IpcRendererEvent, data: unknown) => {
      if (
        FTON.isFTON(data) &&
        Type.isArray(data) &&
        Type.isObject(data[0]) &&
        Type.has(data[0], 'message') &&
        FTON.isFTON(data[0].message)
      ) {
        log('*** Async message formed properly:');
        log(data[0]);
        HandleMessage(data[0].message);
      } else {
        err('>>> Async malformed message begin');
        err(data);
        err('<<< Async malformed message end');
      }
    });
  }
}

let mediaQuery: MediaQueryList | null = null;

// This adds a listener for a media query and invokes it the first time which
// is necessary to get it to start paying attention, apparently.
export function SubscribeMediaMatcher(
  mq: string,
  handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
): void {
  mediaQuery = window.matchMedia(mq);
  mediaQuery.addEventListener('change', handler);
  handler(mediaQuery);
}

export function UnsubscribeMediaMatcher(
  handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
): void {
  mediaQuery?.removeEventListener('change', handler);
}

export async function InvokeMain(
  channel: string,
  key?: string,
): Promise<string | void> {
  let result;
  if (key) {
    log(`Invoking main("${channel}", "${key}")`);
    result = (await window.ipc!.invoke(channel, key)) as string;
    log(`Invoke main ("${channel}" "${key}") returned:`);
  } else {
    log(`Invoking main("${channel}")`);
    result = (await window.ipc!.invoke(channel)) as string;
    log(`Invoke main ("${channel}") returned:`);
  }
  log(result);
  return result;
}
