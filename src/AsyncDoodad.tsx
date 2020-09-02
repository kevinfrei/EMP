// @flow

import * as React from 'react';
import { logger } from '@freik/simplelogger';

import Store from './MyStore';
import { ConfigureIPC } from './Handler';

const log = logger.bind('async');
logger.disable('async');

// This is a react component to enable the IPC subsystem to talk to the store
// It uses a hook to get the store, then passes that on to the IPC subsystem
// It's not clear to me if this forces any sort of re-rendering  :/ ?
const AsyncDoodad = () => {
  const store = Store.useStore();
  // Store subscription change notifications go here
  if (window.ipc === undefined) {
    log('No IPC');
  } else if (window.ipcSet === undefined) {
    log('IPC initialized');
    window.ipcSet = true;
    ConfigureIPC(store);
  }

  // Invisible, because this is just for listening to the main process
  return <div id="async-doodad" style={{ display: 'none' }} />;
};

export default AsyncDoodad;
