// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
import { InitRender } from '@freik/electron-renderer';

InitRender();
// This will expose the ipcRenderer (and isDev) interfaces for use by the
// React components, then, assuming the index.js has already be invoked, it
// calls the function to start the app, thus ensuring that the app has access
// to the ipcRenderer to enable asynchronous callbacks to affect the Undux store

// Yeah, this is unsafe
// Should eventually is contextBridge.exposeInMainWorld
// If I change that around, then I can switch contextIsolation in window.ts
// to false
