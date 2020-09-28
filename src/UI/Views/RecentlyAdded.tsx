import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { ViewProps } from './Selector';

export default function RecentlyAdded({ hidden }: ViewProps): JSX.Element {
  return (
    <div
      className="current-view"
      style={hidden ? { visibility: 'hidden' } : {}}
    >
      <div>Not</div>
      <div>Yet</div>
      <div>Implemented</div>
    </div>
  );
}
