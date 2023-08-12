import {
  ISliderStyles,
  ISpinButtonStyleProps,
  ISpinButtonStyles,
  IStyleFunctionOrObject,
  Position,
  SpinButton,
} from '@fluentui/react';
import { Ipc, useListener, useMediaEffect } from '@freik/electron-render';
import { IpcId, Keys } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import { DebouncedDelay } from '@freik/sync';
import { isNumber, isUndefined } from '@freik/typechk';
import { BoolState, Catch, useMyTransaction } from '@freik/web-utils';
import {
  CSSProperties,
  Component,
  ForwardedRef,
  ReactChildren,
  SyntheticEvent,
  useEffect,
} from 'react';
import { RecoilState, useRecoilState, useRecoilValue } from 'recoil';
import { keyBufferState } from '../Recoil/KeyBuffer';
import { isMiniplayerState } from '../Recoil/Local';
import { saveableFunc } from '../Recoil/PlaylistsState';
import { MenuHandler } from './MenuHandler';
import { isSearchBox } from './Sidebar';

const { wrn } = MakeLog('EMP:render:Utilities');

// Used by the key buffer to know when to reset the keys
// eslint-disable-next-line @typescript-eslint/no-empty-function
let lastHeard: () => void = () => {};

// In order to allow scrolling to work, we need to clear out the key buffer
// once it's been "consumed"
// eslint-disable-next-line @typescript-eslint/naming-convention
const ResetTheKeyBufferTimer = DebouncedDelay(() => lastHeard(), 750);

function TypingListener(): JSX.Element {
  /* This is for a global search typing thingamajig */
  // Connect the reset callback properly
  lastHeard = useMyTransaction(
    ({ reset }) =>
      () =>
        reset(keyBufferState),
  );
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
  useEffect(() => {
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, [listener]);
  return <></>;
}

// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
function SaveMenuUpdater(): JSX.Element {
  /* Save menu state maintenance */
  const saveable = useRecoilValue(saveableFunc);
  useEffect(() => {
    Ipc.PostMain(IpcId.SetSaveMenu, saveable).catch(Catch);
  }, [saveable]);
  return <></>;
}

// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
function ResizeListener(): JSX.Element {
  /* Resizing event handling stuff */
  const handleWidthChange = useMyTransaction(
    ({ set }) =>
      (ev: MediaQueryList | MediaQueryListEvent) => {
        set(isMiniplayerState, ev.matches);
      },
  );
  useMediaEffect('(max-width: 499px)', handleWidthChange);
  return <></>;
}
// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
function MediaAndMenuListeners({
  audioRef,
}: {
  audioRef: ForwardedRef<HTMLAudioElement>;
}): JSX.Element {
  /* Menu handlers coming from the Main process */
  wrn('MenuAndMenuListers');
  const menuCallback = useMyTransaction(
    (xact) => (data: unknown) => MenuHandler(xact, data, audioRef),
  );
  useListener(IpcId.MenuAction, menuCallback);
  /* OS-level media control event handlers */
  const useMediaAction = (ev: MediaSessionAction, state: string) => {
    useEffect(() => {
      navigator.mediaSession.setActionHandler(ev, () =>
        menuCallback({ state }),
      );
      return () => navigator.mediaSession.setActionHandler(ev, null);
    });
  };
  useMediaAction('play', 'playback');
  useMediaAction('pause', 'playback');
  useMediaAction('stop', 'playback');
  useMediaAction('nexttrack', 'nextTrack');
  useMediaAction('previoustrack', 'prevTrack');
  return <></>;
}
// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
export function Utilities(props: {
  audioRef: ForwardedRef<HTMLAudioElement>;
}): JSX.Element {
  return (
    <>
      <ResizeListener />
      <TypingListener />
      <SaveMenuUpdater />
      <MediaAndMenuListeners audioRef={props.audioRef} />
    </>
  );
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export const HostOs: 'mac' | 'windows' | 'linux' = (() => {
  const ua = window.navigator.userAgent;
  if (ua.indexOf('Mac') >= 0) {
    return 'mac';
  }
  if (ua.indexOf('Windows') >= 0) {
    return 'windows';
  }
  return 'linux';
})();

const accPrefix = HostOs === 'mac' ? '⌘' : 'Ctrl';

export function GetHelperText(key: Keys) {
  if (key.length === 1) {
    return `${accPrefix}-${key}`;
  }
  if (key === Keys.PreviousTrack) {
    return accPrefix + '-←';
  }
  if (key === Keys.NextTrack) {
    return accPrefix + '-→';
  }
}

export function useRecoilBoolState(st: RecoilState<boolean>): BoolState {
  const [value, setter] = useRecoilState(st);
  return [value, () => setter(true), () => setter(false)];
}

export type StringSpinButtonProps = {
  id?: string;
  className?: string;
  label?: string;
  value: number;
  filter: (val: string) => number | undefined;
  format: (val: number) => string;
  min: number;
  max: number;
  step: number;
  onChange: (newValue?: number) => void;
  style?: CSSProperties;
  labelPosition?: Position;
  styles?: IStyleFunctionOrObject<ISpinButtonStyleProps, ISpinButtonStyles>;
};

export function StringSpinButton({
  id,
  className,
  label,
  value,
  filter,
  format,
  min,
  max,
  step,
  onChange,
  style,
  styles,
  labelPosition,
}: StringSpinButtonProps): JSX.Element {
  const onIncrement = (val: string): string | void => {
    const num = filter(val);
    if (isNumber(num)) {
      return format(Math.min(num + step, max));
    }
  };
  const onDecrement = (val: string): string | void => {
    const num = filter(val);
    if (isNumber(num)) {
      return format(Math.max(num - step, min));
    }
  };
  const onValidate = (val: string): string | void => {
    const num = filter(val);
    if (isNumber(num)) {
      return format(Math.max(Math.min(num, max), min));
    }
  };
  const internalChange = (
    event: SyntheticEvent<HTMLElement>,
    newValue?: string,
  ) => {
    const numVal = isUndefined(newValue) ? newValue : filter(newValue);
    onChange(numVal);
  };
  return (
    <SpinButton
      id={id}
      className={className}
      label={label}
      value={format(value)}
      style={style}
      styles={styles}
      labelPosition={labelPosition}
      onChange={internalChange}
      onValidate={onValidate}
      onIncrement={onIncrement}
      onDecrement={onDecrement}
    />
  );
}

export class ErrorBoundary extends Component {
  state: { hasError: boolean };
  constructor(props: { children: ReactChildren }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // You can also log the error to an error reporting service
    wrn(error);
    wrn(errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h4>Something went wrong</h4>;
    }

    return this.props.children;
  }
}
