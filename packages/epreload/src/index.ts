import type { ElectronWindow } from '@freik/electron-render';
import { MakeLog } from '@freik/logger';
import { clipboard, contextBridge, ipcRenderer } from 'electron';

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { wrn } = MakeLog('@freik:electron-preload');

declare let window: ElectronWindow;

function getHostOs(): 'mac' | 'win' | 'lin' | 'unk' {
  const ua = navigator.userAgent;
  if (ua.indexOf('Macintosh') >= 0) {
    return 'mac';
  }
  if (ua.indexOf('Windows') >= 0) {
    return 'win';
  }
  if (ua.indexOf('Linux') >= 0) {
    return 'lin';
  }
  return 'unk';
}

function onDOMContentLoaded() {
  const ec = {
    ipc: ipcRenderer,
    clipboard,
    hostOs: getHostOs(),
  };
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('electronConnector', ec);
    } catch (e) {
      wrn(e);
    }
  } else {
    window.electronConnector = ec;
  }
  if (window.initApp) {
    window.initApp();
  } else {
    wrn('FAILURE: No window.initApp() attached.');
  }
}

let init = false;
export function InitRender(): void {
  if (init) {
    return;
  }
  init = true;
  window.addEventListener('DOMContentLoaded', onDOMContentLoaded);
}
