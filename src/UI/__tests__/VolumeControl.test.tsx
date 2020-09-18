import React from 'react';
import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import VolumeControl from '../VolumeControl';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <React.Suspense fallback="">
        <VolumeControl />
      </React.Suspense>
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
