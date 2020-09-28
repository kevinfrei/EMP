import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { ViewProps } from './Selector';

export default function SearchResultsView({ hidden }: ViewProps): JSX.Element {
  return (
    <div style={hidden ? { visibility: 'hidden' } : {}}>
      No Searching functionality just yet
    </div>
  );
}
