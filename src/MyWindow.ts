// This is for getting at "global" stuff from the window object
import { Logger } from '@freik/core-utils';
import { OpenDialogSyncOptions } from 'electron/main';

import type { IpcRenderer } from 'electron';

const log = Logger.bind('MyWindow');
// Logger.enable('MyWindow');

interface MyWindow extends Window {
  ipc: IpcRenderer | undefined;
  remote: Electron.Remote | undefined;
  isDev: boolean | undefined;
  initApp: undefined | (() => void);
  ipcSet: boolean | undefined;
}

declare let window: MyWindow;

// The basics (I never want to use window directly, I think...
export function SetTimeout(handler: () => any, timeout?: number): number {
  return window.setTimeout(handler, timeout);
}

export function ClearTimeout(handle?: number): void {
  window.clearTimeout(handle);
}

let posIntervalId: number | undefined;
export function SetInterval(func: () => void, time: number): void {
  // eslint-disable-next-line id-blacklist
  if (posIntervalId !== undefined) {
    window.clearInterval(posIntervalId);
  }
  posIntervalId = window.setInterval(func, time);
}

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
    // Nothing to do here, actually
  }
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
