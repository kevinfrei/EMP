import { initializeIcons } from '@uifabric/icons';
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { RecoilRoot } from 'recoil';
import SearchResultsView from '../Views/SearchResults';
import Settings from '../Views/Settings';

it('Render Settings without crashing', () => {
  initializeIcons();
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <React.Suspense fallback="">
        <Settings />
      </React.Suspense>
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});

it('Render SearchResults without crashing', () => {
  initializeIcons();
  const div = document.createElement('div');
  act(() => {
    ReactDOM.render(
      <RecoilRoot>
        <React.Suspense fallback="">
          <SearchResultsView />
        </React.Suspense>
      </RecoilRoot>,
      div,
    );
  });
  ReactDOM.unmountComponentAtNode(div);
});
