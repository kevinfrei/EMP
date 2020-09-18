import React from 'react';
import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import Sidebar from '../Sidebar';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <Sidebar />
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
