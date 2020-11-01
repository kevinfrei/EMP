import { Spinner, SpinnerLabelPosition, SpinnerSize } from '@fluentui/react';
import React, { Suspense } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { InitialWireUp } from '../Tools';

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
