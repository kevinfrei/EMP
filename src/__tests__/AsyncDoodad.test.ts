import React from 'react';
import ReactDOM from 'react-dom';
import AsyncDoodad from '../AsyncDoodad';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<AsyncDoodad />, div);
  ReactDOM.unmountComponentAtNode(div);
});
