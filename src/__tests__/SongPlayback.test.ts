import React from 'react';
import ReactDOM from 'react-dom';
import SongPlayback from '../SongPlayback';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<SongPlayback />, div);
  ReactDOM.unmountComponentAtNode(div);
});
