import {
  IconButton,
  IFontStyles,
  ISeparatorStyles,
  ISliderStyles,
  IStyle,
  IToggleStyles,
  Separator,
  Spinner as FluentSpinner,
  SpinnerLabelPosition,
  SpinnerSize,
  Stack,
  Text,
  Toggle,
} from '@fluentui/react';
import { DebouncedDelay, MakeError, Type } from '@freik/core-utils';
import { Suspense, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import {
  InitialWireUp,
  PostMain,
  SubscribeMediaMatcher,
  UnsubscribeMediaMatcher,
} from '../MyWindow';
import { useMyTransaction } from '../Recoil/api';
import { BoolState, useListener } from '../Recoil/helpers';
import { isMiniplayerState, keyBufferState } from '../Recoil/Local';
import { saveableFunc } from '../Recoil/PlaylistsState';
import { MenuHandler } from './MenuHandler';
import { isSearchBox } from './Sidebar';
import './styles/Utilities.css';

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
  const callback = useMyTransaction(xact => (data: unknown) =>
    MenuHandler(xact, data),
  );
  useListener('menuAction', callback);
  const handleWidthChange = useMyTransaction(
    ({ set }) => (ev: MediaQueryList | MediaQueryListEvent) => {
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
  lastHeard = useMyTransaction(({ reset }) => () => reset(keyBufferState));
  useEffect(() => {
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  });
  return <></>;
}

export type SpinnerProps = {
  children: JSX.Element | JSX.Element[];
  label?: string;
  position?: SpinnerLabelPosition;
  size?: SpinnerSize;
};

export function Spinner({
  children,
  label,
  position,
  size,
}: SpinnerProps): JSX.Element {
  const theLabel = label ? label : 'Please wait...';
  const pos = position ? position : 'bottom';
  const sz = size ? size : SpinnerSize.medium;
  const theSpinner = (
    <div className="mySpinner">
      <FluentSpinner label={theLabel} labelPosition={pos} size={sz} />
    </div>
  );
  return <Suspense fallback={theSpinner}>{children}</Suspense>;
}

type StateToggleProps = {
  label: string;
  state: BoolState;
  disabled?: boolean;
  style?: IStyle;
};
// A helper for a toggle that uses a BoolState variable
export function StateToggle({
  label,
  state,
  disabled,
  style,
}: StateToggleProps): JSX.Element {
  const customStyle: Partial<IToggleStyles> = {};
  if (style) {
    customStyle.root = style;
  }
  return (
    <Toggle
      inlineLabel
      disabled={disabled}
      label={label}
      checked={state[0]}
      styles={customStyle}
      onChange={(_ev, checked?: boolean) => state[checked ? 2 : 1]()}
    />
  );
}

// A little control that expands or collapses the children
// with the header provided
export function Expandable({
  children,
  label,
  defaultShow,
  separator,
  variant,
}: {
  children: JSX.Element | JSX.Element[];
  label: string | JSX.Element;
  defaultShow?: boolean;
  separator?: boolean;
  variant?: keyof IFontStyles;
}): JSX.Element {
  const [hidden, setHidden] = useState(!defaultShow);
  const button = (
    <IconButton
      iconProps={{
        iconName: hidden ? 'ChevronRight' : 'ChevronDown',
      }}
      onClick={() => setHidden(!hidden)}
    />
  );
  let theHeader: JSX.Element;
  if (separator) {
    const customStyle: Partial<ISeparatorStyles> = {
      root: { marginLeft: '-10px' },
    };
    const v = variant || 'large';
    theHeader = (
      <Separator alignContent="start" styles={customStyle}>
        {button}
        {Type.isString(label) ? <Text variant={v}>&nbsp;{label}</Text> : label}
      </Separator>
    );
  } else {
    const v = variant || 'medium';
    theHeader = (
      <Stack horizontal verticalAlign="center" style={{ marginTop: 10 }}>
        {button}
        {Type.isString(label) ? <Text variant={v}>{label}</Text> : label}
      </Stack>
    );
  }
  return (
    <>
      {theHeader}
      <div style={hidden ? { display: 'none' } : {}}>{children}</div>
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
