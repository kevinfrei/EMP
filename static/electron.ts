// This is the entry point for the electron main process.
// It uses main/electronSetup to get the first window open.
// It invokes the Startup promise/async function (from main/General)
// initially. It also invokes the Ready function (from main/Ready)
// once the window has registered.

import { MakeLogger } from '@freik/core-utils';
import { BrowserWindow } from 'electron';
import { Begin, Init } from './main/Communication';
import electronSetup from './main/electronSetup';
import { Ready, Startup } from './main/Startup';

const log = MakeLogger('electron');

Init();

async function onWindowCreated(window: BrowserWindow): Promise<void> {
  try {
    log('Window Created');
    await Startup();
    log('Invoking main/Startup/Ready');
    Ready(window);
    log('Invoking main/Communication/Begin');
    Begin(window);
  } catch (e) {
    log(e);
    window.webContents.send('data', '{"error":"loading"}');
  }
}

electronSetup(onWindowCreated);
