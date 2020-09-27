import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { ViewProps } from './Selector';

export default function RecentlyAdded({ hidden }: ViewProps): JSX.Element {
  return (
    <div hidden={hidden}>
      <div>Not</div>
      <div>Yet</div>
      <div>Implemented</div>
    </div>
  );
}
