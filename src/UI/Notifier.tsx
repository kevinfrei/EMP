import { MessageBar, MessageBarType } from '@fluentui/react';
import { useEffect } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { displayMessageState, recentlyQueuedState } from '../Recoil/Local';
import './styles/Notifier.css';

// This is a little self-contained notification doohickey
// Currently, it only displays the last "added some songs" message
// Probably make it do other things, too, yeah?
export function Notifier(): JSX.Element {
  const addedSongs = useRecoilValue(recentlyQueuedState);
  const displayed = useRecoilValue(displayMessageState);
  const clearIt = useRecoilCallback(({ set }) => () =>
    set(recentlyQueuedState, 0),
  );
  const startFade = useRecoilCallback(({ set }) => () =>
    set(displayMessageState, false),
  );
  useEffect(() => {
    const clr = setTimeout(clearIt, 5000);
    const dsp = setTimeout(startFade, 4000);
    return () => {
      clearTimeout(clr);
      clearTimeout(dsp);
    };
  }, [addedSongs, clearIt, startFade, displayed]);
  return addedSongs > 0 ? (
    <MessageBar
      className={displayed ? '' : 'fade-out'}
      messageBarType={MessageBarType.success}
      isMultiline={true}
    >
      Added {addedSongs} songs to the Now Playing queue
    </MessageBar>
  ) : (
    <></>
  );
}
