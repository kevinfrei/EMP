import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { PersistenceObserver } from '../Recoil/helpers';
import { InitialWireUp } from '../Tools';

// This is a react component to enable the IPC subsystem to talk to the store
// It uses a hook to get the store, then passes that on to the IPC subsystem
// It's not clear to me if this forces any sort of re-rendering  :/ ?
export default function Utilities(): JSX.Element {
  // Store subscription change notifications go here
  React.useEffect(InitialWireUp);
  // Invisible, because this is just for listening to the main process
  return <PersistenceObserver />;
}
