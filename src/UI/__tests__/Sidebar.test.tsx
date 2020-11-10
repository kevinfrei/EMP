import { initializeIcons } from '@uifabric/icons';
import React from 'react';
import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import Sidebar from '../Sidebar';

it('renders without crashing', () => {
  initializeIcons();
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <React.Suspense fallback="">
        <Sidebar />
      </React.Suspense>
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
