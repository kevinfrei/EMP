import {
  ISliderStyles,
  ISpinButtonStyleProps,
  ISpinButtonStyles,
  IStyleFunctionOrObject,
  Position,
  SpinButton,
} from '@fluentui/react';
import { Ipc, useListener, useMediaEffect } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';
import { DebouncedDelay } from '@freik/sync';
import { isNumber, isUndefined } from '@freik/typechk';
import { Catch } from '@freik/web-utils';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  CSSProperties,
  Component,
  ForwardedRef,
  SyntheticEvent,
  useEffect,
} from 'react';
import { keyBufferState } from '../Jotai/KeyBuffer';
import { isMiniplayerState } from '../Jotai/Local';
import { saveableFunc } from '../Jotai/Playlists';
import { MenuHandler } from './MenuHandler';
import { isSearchBox } from './Sidebar';

const { wrn } = MakeLog('EMP:render:Utilities');

// Used by the key buffer to know when to reset the keys

let lastHeard: () => void = () => {};

// In order to allow scrolling to work, we need to clear out the key buffer
// once it's been "consumed"

const ResetTheKeyBufferTimer = DebouncedDelay(() => lastHeard(), 750);

function TypingListener(): JSX.Element {
  /* This is for a global search typing thingamajig */
  const [keyBuffer, setKeyBuffer] = useAtom(keyBufferState);
  lastHeard = () => setKeyBuffer('');

  useEffect(() => {
    const listener = (ev: KeyboardEvent) => {
      if (!isSearchBox(ev.target)) {
        if (ev.key.length > 1 || ev.altKey || ev.ctrlKey || ev.metaKey) {
          setKeyBuffer('');
        } else {
          ResetTheKeyBufferTimer();
          setKeyBuffer(keyBuffer + ev.key);
        }
      }
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, [keyBuffer, setKeyBuffer]);
  return <></>;
}

// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
function SaveMenuUpdater(): JSX.Element {
  /* Save menu state maintenance */
  const saveable = useAtomValue(saveableFunc);
  useEffect(() => {
    Ipc.PostMain(IpcId.SetSaveMenu, saveable).catch(Catch);
  }, [saveable]);
  return <></>;
}

// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
function ResizeListener(): JSX.Element {
  const setIsMiniplayer = useSetAtom(isMiniplayerState);
  /* Resizing event handling stuff */
  const handleWidthChange = (ev: MediaQueryList | MediaQueryListEvent) => {
    setIsMiniplayer(ev.matches);
  };
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
  const menuCallback = (data: unknown) => {
    void MenuHandler(data, audioRef);
  };
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

type EBProps = { children: React.ReactNode };
type EBState = { hasError: boolean };
export class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
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
