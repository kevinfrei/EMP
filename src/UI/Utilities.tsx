import { ISliderStyles } from '@fluentui/react';
import { DebouncedDelay, MakeError } from '@freik/core-utils';
import { useMyTransaction } from '@freik/web-utils';
import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import {
  InitialWireUp,
  PostMain,
  SubscribeMediaMatcher,
  UnsubscribeMediaMatcher,
} from '../MyWindow';
import { useListener } from '../Recoil/helpers';
import { isMiniplayerState, keyBufferState } from '../Recoil/Local';
import { saveableFunc } from '../Recoil/PlaylistsState';
import { MenuHandler } from './MenuHandler';
import { isSearchBox } from './Sidebar';

const err = MakeError('Utilities-err'); // eslint-disable-line

// Used by the key buffer to know when to reset the keys
// eslint-disable-next-line @typescript-eslint/no-empty-function
let lastHeard = () => {};

// In order to allow scrolling to work, we need to clear out the key buffer
// once it's been "consumed"
// eslint-disable-next-line @typescript-eslint/naming-convention
const ResetTheKeyBufferTimer = DebouncedDelay(() => lastHeard(), 750);

// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
export default function Utilities(): JSX.Element {
  const saveable = useRecoilValue(saveableFunc);
  useEffect(InitialWireUp);
  const callback = useMyTransaction(
    (xact) => (data: unknown) => MenuHandler(xact, data),
  );
  useListener('menuAction', callback);
  const handleWidthChange = useMyTransaction(
    ({ set }) =>
      (ev: MediaQueryList | MediaQueryListEvent) => {
        set(isMiniplayerState, ev.matches);
      },
  );
  useEffect(() => {
    SubscribeMediaMatcher('(max-width: 499px)', handleWidthChange);
    return () => UnsubscribeMediaMatcher(handleWidthChange);
  });
  useEffect(() => {
    void PostMain('set-save-menu', saveable);
  }, [saveable]);
  /* This is for a global search typing thingamajig */
  const listener = useMyTransaction(({ set }) => (ev: KeyboardEvent) => {
    if (!isSearchBox(ev.target)) {
      if (ev.key.length > 1 || ev.altKey || ev.ctrlKey || ev.metaKey) {
        set(keyBufferState, '');
      } else {
        ResetTheKeyBufferTimer();
        set(keyBufferState, (curVal: string) => curVal + ev.key);
      }
    }
  });
  // Connect the reset callback properly
  lastHeard = useMyTransaction(
    ({ reset }) =>
      () =>
        reset(keyBufferState),
  );
  useEffect(() => {
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  });
  return <></>;
}

export const mySliderStyles: Partial<ISliderStyles> = {
  thumb: {
    borderWidth: 1,
    width: 6,
    height: 10,
    top: -3,
    zIndex: 100,
  },
  line: {
    zIndex: 100,
  },
};
