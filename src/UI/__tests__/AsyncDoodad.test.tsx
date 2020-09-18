import React from 'react';
import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import AsyncDoodad from '../Utilities';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <AsyncDoodad />
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
