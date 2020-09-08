import * as React from 'react';

import Store from './MyStore';
import { InitialWireUp } from './MyWindow';

// This is a react component to enable the IPC subsystem to talk to the store
// It uses a hook to get the store, then passes that on to the IPC subsystem
// It's not clear to me if this forces any sort of re-rendering  :/ ?
export default function AsyncDoodad(): JSX.Element {
  const store = Store.useStore();
  // Store subscription change notifications go here
  InitialWireUp(store);
  // Invisible, because this is just for listening to the main process
  return <div id="async-doodad" style={{ display: 'none' }} />;
}
