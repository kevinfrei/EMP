// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// import { InitRender } from '@freik/electron-renderer';
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
import { ElectronWindow } from '@freik/electron-preload';
import { MakeLog } from '@freik/logger';
import { clipboard, contextBridge, ipcRenderer } from 'electron';

const { wrn } = MakeLog('renderer');

// This needs to stay in sync with the @freik/elect-render-utils type
// The presence of the Electron.Clipboard item is a little problematic
// when thinking about moving it into my web-utils thing. Maybe I export
// it from the render-utils and pull it in here...

declare let window: ElectronWindow;

// This will expose the ipcRenderer interface for use by the
// React components, then, assuming the index.js has already be invoked, it
// calls the function to start the app, thus ensuring that the app has access
// to the ipcRenderer to enable asynchronous callbacks to affect the Undux store

// Yeah, this is unsafe
// Should eventually use contextBridge.exposeInMainWorld
// If I change that around, then I can switch contextIsolation in window.ts
// to false
let init = false;

/**
 * This is the magic that makes everything else in the elect-render-utils
 * work properly. It must be invoked from inside the renderer.js file that
 * lives in the static side of the codebase!
 */
function InitRender(): void {
  if (init) {
    return;
  }
  init = true;
  window.addEventListener('DOMContentLoaded', () => {
    if (window.initApp) {
      window.initApp();
    } else {
      wrn('FAILURE: No window.initApp() attached.');
    }
  });
}

// This will expose the ipcRenderer (and isDev) interfaces for use by the
// React components, then, assuming the index.js has already be invoked, it
// calls the function to start the app, thus ensuring that the app has access
// to the ipcRenderer to enable asynchronous callbacks to affect the Undux store

// Yeah, this is unsafe
// Should eventually is contextBridge.exposeInMainWorld
// If I change that around, then I can switch contextIsolation in window.ts
// to false

InitRender();

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
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronConnector', {
      ipc: ipcRenderer,
      hostOs: getHostOs(),
      clipboard,
    });
  } catch (e) {
    wrn(e);
  }
} else {
  window.electronConnector = {
    ipc: ipcRenderer,
    hostOs: getHostOs(),
    clipboard,
  };
}
