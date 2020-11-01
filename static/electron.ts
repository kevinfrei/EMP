// This is the entry point for the electron main process.
// It uses main/electronSetup to get the first window open.
// It invokes the Startup promise/async function (from main/General)
// initially. It also invokes the Ready function (from main/Ready)
// once the window has registered.

import { MakeLogger } from '@freik/core-utils';
import { BrowserWindow } from 'electron';
import { CommsWindowBegin } from './main/Communication';
import electronSetup from './main/electronSetup';
import { InitBeforeAnythingElse, WindowStartup } from './main/Startup';

const err = MakeLogger('electron-err', true);

InitBeforeAnythingElse();

async function onWindowCreated(window: BrowserWindow): Promise<void> {
  try {
    await WindowStartup();
    CommsWindowBegin(window);
  } catch (e) {
    err(e);
    window.webContents.send('data', '{"error":"loading"}');
  }
}

electronSetup(onWindowCreated);
