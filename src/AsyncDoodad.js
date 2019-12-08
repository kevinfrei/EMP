// @flow

import * as React from 'react';
import Store from './MyStore';
import { ConfigureIPC } from './Handler';
import logger from 'simplelogger';

const log = logger.bind('async');
//logger.disable('async');

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

// I feel like this is probably too complex
// Honestly, I need a simple set of primitives:
// Render => Main: Save this key/value pair, delete this key (and it's value)
//  Everything else is a URL fetch
//  Not quite true: Need some better way of dealing with playlists, probably
// Main => Render: Add this (song/artist/album/playlist) to the database

export default AsyncDoodad;
