import {
  ISliderStyles,
  ISpinButtonStyleProps,
  ISpinButtonStyles,
  IStyleFunctionOrObject,
  Position,
  SpinButton,
} from '@fluentui/react';
import { DebouncedDelay, MakeError, Type } from '@freik/core-utils';
import { Ipc, MediaQuery, useListener } from '@freik/elect-render-utils';
import { BoolState, Catch, useMyTransaction } from '@freik/web-utils';
import {
  Component,
  CSSProperties,
  ReactChildren,
  SyntheticEvent,
  useEffect,
} from 'react';
import { RecoilState, useRecoilState, useRecoilValue } from 'recoil';
import { IpcId, Keys } from 'shared';
import { keyBufferState } from '../Recoil/KeyBuffer';
import { isMiniplayerState } from '../Recoil/Local';
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
export function Utilities(): JSX.Element {
  const saveable = useRecoilValue(saveableFunc);
  const menuCallback = useMyTransaction(
    (xact) => (data: unknown) => MenuHandler(xact, data),
  );
  useListener(IpcId.MenuAction, menuCallback);
  const handleWidthChange = useMyTransaction(
    ({ set }) =>
      (ev: MediaQueryList | MediaQueryListEvent) => {
        set(isMiniplayerState, ev.matches);
      },
  );
  useEffect(() => {
    MediaQuery.SubscribeMediaMatcher('(max-width: 499px)', handleWidthChange);
    return () => MediaQuery.UnsubscribeMediaMatcher(handleWidthChange);
  });
  useEffect(() => {
    Ipc.PostMain(IpcId.SetSaveMenu, saveable).catch(Catch);
  }, [saveable]);
  useEffect(() => {
    // Media stuff:
    navigator.mediaSession.setActionHandler('play', () =>
      menuCallback({ state: 'playback' }),
    );
    navigator.mediaSession.setActionHandler('pause', () =>
      menuCallback({ state: 'playback' }),
    );
    navigator.mediaSession.setActionHandler('stop', () =>
      menuCallback({ state: 'playback' }),
    );
    navigator.mediaSession.setActionHandler('nexttrack', () =>
      menuCallback({ state: 'nextTrack' }),
    );
    navigator.mediaSession.setActionHandler('previoustrack', () =>
      menuCallback({ state: 'prevTrack' }),
    );
  });
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
  if (key === 'Left') {
    return accPrefix + '-←';
  }
  if (key === 'Right') {
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
    if (Type.isNumber(num)) {
      return format(Math.min(num + step, max));
    }
  };
  const onDecrement = (val: string): string | void => {
    const num = filter(val);
    if (Type.isNumber(num)) {
      return format(Math.max(num - step, min));
    }
  };
  const onValidate = (val: string): string | void => {
    const num = filter(val);
    if (Type.isNumber(num)) {
      return format(Math.max(Math.min(num, max), min));
    }
  };
  const internalChange = (
    event: SyntheticEvent<HTMLElement>,
    newValue?: string,
  ) => {
    const numVal = Type.isUndefined(newValue) ? newValue : filter(newValue);
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
    // eslint-disable-next-line no-console
    console.error(error);
    // eslint-disable-next-line no-console
    console.error(errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h4>Something went wrong</h4>;
    }

    return this.props.children;
  }
}
