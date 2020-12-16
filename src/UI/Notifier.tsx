import { MessageBar, MessageBarType } from '@fluentui/react';
import { useEffect } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { recentlyQueuedState } from '../Recoil/Local';
import './styles/Sidebar.css';

// This is a little self-contained notification doohickey
// Currently, it only displays the last "added some songs" message
// Probably make it do other things, too, yeah?
export function Notifier(): JSX.Element {
  const addedSongs = useRecoilValue(recentlyQueuedState);
  const clearIt = useRecoilCallback(({ set }) => () =>
    set(recentlyQueuedState, 0),
  );
  useEffect(() => {
    const timeout = setTimeout(clearIt, 5000);
    return () => clearTimeout(timeout);
  }, [addedSongs, clearIt]);
  return addedSongs > 0 ? (
    <MessageBar messageBarType={MessageBarType.success} isMultiline={true}>
      Added {addedSongs} songs to the Now Playing queue
    </MessageBar>
  ) : (
    <></>
  );
}
