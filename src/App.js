// @flow
// @format
import React from 'react';
import logo from './logo.svg';
import './App.css';

const App = () => {
  const foo: string = 'Visible files:';
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit file <code>src/App.js</code> and save to reload.
        </p>
        <p>
          We are using Node.js v<span id="node-version" />, Chromium v
          <span id="chrome-version" />, and Electron v
          <span id="electron-version" />.
        </p>
        <p>
          {foo} <span id="files" />
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
};
export default App;
