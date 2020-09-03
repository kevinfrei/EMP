import React from 'react';
import ReactDOM from 'react-dom';
import Sidebar from '../Sidebar';
import Store from '../MyStore';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Store.Container>
      <Sidebar />
    </Store.Container>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
