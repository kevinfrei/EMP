import debug from 'debug';
import { InitBeforeAnythingElse, WindowStartup } from './main/Startup';
import { StartApp } from './main/electronSetup';

const err = debug('EMP:main:electron');

// This is the entry point for the electron main process.
// It uses main/electronSetup to get the first window open.
// It invokes the Startup promise/async function (from main/General)
// initially. It also invokes the Ready function (from main/Ready)
// once the window has registered.

InitBeforeAnythingElse();

StartApp(WindowStartup).catch(err);
