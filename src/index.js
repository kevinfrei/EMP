// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import logger from 'simplelogger';
import { FTON } from 'my-utils';

import App from './App';
import * as serviceWorker from './serviceWorker';

import './styles/index.css';

const log = logger.bind('index');
logger.disable('index');

window.initApp = () => {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(<App />, root);
  }
};

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
