import { MessageBar, MessageBarType } from '@fluentui/react';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { displayMessageAtom, recentlyQueuedAtom } from '../Jotai/Local';
import './styles/Notifier.css';

// This is a little self-contained notification doohickey
// Currently, it only displays the last "added some songs" message
// Probably make it do other things, too, yeah?
export function Notifier(): JSX.Element {
  const [addedSongs, setRecentlyQueued] = useAtom(recentlyQueuedAtom);
  const [displayed, setDisplayMessage] = useAtom(displayMessageAtom);
  useEffect(() => {
    const clearIt = () => setRecentlyQueued(0);
    const startFade = () => setDisplayMessage(false);
    const clr = setTimeout(clearIt, 5000);
    const dsp = setTimeout(startFade, 4000);
    return () => {
      clearTimeout(clr);
      clearTimeout(dsp);
    };
  }, [addedSongs, displayed]);
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
