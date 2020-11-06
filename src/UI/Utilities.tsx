import {
  IconButton,
  ISeparatorStyles,
  IStyle,
  IToggleStyles,
  Separator,
  Spinner,
  SpinnerLabelPosition,
  SpinnerSize,
  Text,
  Toggle,
} from '@fluentui/react';
import React, { Suspense } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { InitialWireUp } from '../MyWindow';
import { BoolState } from '../Recoil/helpers';

// This is a react component to enable the IPC subsystem to talk to the store
export default function Utilities(): JSX.Element {
  React.useEffect(InitialWireUp);
  return <></>;
}

export type SpinnerProps = {
  children: JSX.Element | JSX.Element[];
  label?: string;
  position?: SpinnerLabelPosition;
  size?: SpinnerSize;
};

export function Spin({
  children,
  label,
  position,
  size,
}: SpinnerProps): JSX.Element {
  const theLabel = label ? label : 'Please wait...';
  const pos = position ? position : 'bottom';
  const sz = size ? size : SpinnerSize.medium;
  const theSpinner = <Spinner label={theLabel} labelPosition={pos} size={sz} />;
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
export function ExpandableSeparator({
  state,
  label,
  children,
}: {
  state: BoolState;
  label: string;
  children: JSX.Element | JSX.Element[];
}): JSX.Element {
  const customStyle: Partial<ISeparatorStyles> = {};
  customStyle.root = { marginLeft: '-10px' };
  return (
    <>
      <Separator alignContent="start" styles={customStyle}>
        <IconButton
          iconProps={{
            iconName: state[0] ? 'ChevronDown' : 'ChevronRight',
          }}
          onClick={state[state[0] ? 1 : 2]}
        />
        <Text variant="large">&nbsp;{label}</Text>
      </Separator>
      {state[0] ? children : <></>}
    </>
  );
}
