// eslint-disable-next-line @typescript-eslint/no-use-before-define
import { initializeIcons } from '@uifabric/icons';
import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import { SetInit } from './Tools';
import App from './UI/App';
import './UI/styles/index.css';

SetInit(() => {
  initializeIcons();
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(<App />, root);
  }
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
