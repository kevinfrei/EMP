import React from 'react';
import ReactDOM from 'react-dom';
import SongControls from '../SongControls';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<SongControls />, div);
  ReactDOM.unmountComponentAtNode(div);
});
