// This is the entry point for the electron main process.
// It uses main/electronSetup to get the first window open.
// It invokes the Startup promise/async function (from main/General)
// initially. It also invokes the Ready function (from main/Ready)
// once the window has registered.

import { logger } from '@freik/simplelogger';

import electronSetup from './main/electronSetup';
import { Startup, Ready } from './main/Startup';
import { Init, Begin } from './main/Communication';

import type { BrowserWindow } from 'electron';
import type { OnWindowCreated } from './main/electronSetup';

const log = logger.bind('electron');
// logger.enable('electron');

// const win = null;

const onWindowCreated: OnWindowCreated = (window: BrowserWindow): void => {
  log('Window Created');
  Startup()
    .then(() => {
      log('Invoking main/Startup/Ready');
      Ready(window);
      log('Invoking main/Communication/Begin');
      Begin(window);
    })
    .catch((e) => {
      log(e);
      window.webContents.send('data', '{"error":"loading"}');
    });
};

Init();
electronSetup(onWindowCreated);
