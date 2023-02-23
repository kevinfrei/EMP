import { MakeError } from '@freik/core-utils';
import { StartApp } from './main/electronSetup';
import { InitBeforeAnythingElse, WindowStartup } from './main/Startup';

const err = MakeError('electron.ts');

// This is the entry point for the electron main process.
// It uses main/electronSetup to get the first window open.
// It invokes the Startup promise/async function (from main/General)
// initially. It also invokes the Ready function (from main/Ready)
// once the window has registered.

InitBeforeAnythingElse();

StartApp(WindowStartup).catch(err);
