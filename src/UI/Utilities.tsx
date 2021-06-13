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
import { MakeError, Type } from '@freik/core-utils';
import { Suspense, useEffect, useState } from 'react';
import { CallbackInterface, useRecoilCallback } from 'recoil';
import { useListener } from '../Hooks';
import {
  InitialWireUp,
  SubscribeMediaMatcher,
  UnsubscribeMediaMatcher,
} from '../MyWindow';
import { BoolState } from '../Recoil/helpers';
import { isMiniplayerState, keyBufferState } from '../Recoil/Local';
import { MenuHandler } from './MenuHandler';
import { isSearchBox } from './Sidebar';
import './styles/Utilities.css';

const log = MakeError('Utilities');
const err = MakeError('Utilities-err');

// Used by the key buffer to know when to reset the keys
let lastHeard = performance.now();

// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
export default function Utilities(): JSX.Element {
  useEffect(InitialWireUp);
  const callback = useRecoilCallback(
    (cbInterface) => (data: unknown) => MenuHandler(cbInterface, data),
  );
  useListener('menuAction', callback);
  useListener('main-process-status', (val: unknown) => {
    if (Type.isString(val)) {
      log(`Main status: ${val}`);
    } else {
      err('Invalid value in main-process-status:');
      err(val);
    }
  });
  const handleWidthChange = useRecoilCallback(
    ({ set }) =>
      (ev: MediaQueryList | MediaQueryListEvent) => {
        set(isMiniplayerState, ev.matches);
      },
  );
  useEffect(() => {
    SubscribeMediaMatcher('(max-width: 499px)', handleWidthChange);
    return () => UnsubscribeMediaMatcher(handleWidthChange);
  });
  /* This is for a global search typing thingamajig */
  const listener = useRecoilCallback(
    ({ set }: CallbackInterface) =>
      (ev: KeyboardEvent) => {
        if (!isSearchBox(ev.target)) {
          // TODO: use the keyFilter to navigate the current view?
          const time = performance.now();
          if (
            ev.key === 'Escape' ||
            ev.key === 'Meta' ||
            ev.key === 'Control' ||
            ev.key === 'Alt' ||
            ev.altKey ||
            ev.ctrlKey ||
            ev.metaKey
          ) {
            set(keyBufferState, '');
            return;
          }
          if (ev.key.length > 1) {
            return;
          }
          const clear: boolean = time - lastHeard > 750;
          lastHeard = time;
          set(keyBufferState, (curVal) => (clear ? ev.key : curVal + ev.key));
        }
      },
  );
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

// A helper for a toggle that uses a BoolState variable
export function StateToggle({
  label,
  state,
  disabled,
  style,
}: {
  label: string;
  state: BoolState;
  disabled?: boolean;
  style?: IStyle;
}): JSX.Element {
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
      onChange={(ev, checked?: boolean) => state[checked ? 2 : 1]()}
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
  label: string;
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
        <Text variant={v}>&nbsp;{label}</Text>
      </Separator>
    );
  } else {
    const v = variant || 'medium';
    theHeader = (
      <Stack horizontal verticalAlign="center" style={{ marginTop: 10 }}>
        {button}
        <Text variant={v}>{label}</Text>
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
