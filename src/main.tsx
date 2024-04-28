// Note: This approach works with any SVG icon set, not just @fluentui/react-icons-mdl2
// import { Util } from '@freik/electron-render';
import { Util } from '@freik/electron-render';
import React from 'react';
import ReactDOM from 'react-dom';
import { FluentInitIcons } from './FluentInit';
import { App } from './UI/App';
import './UI/styles/index.css';

Util.SetInit(() => {
  // unregisterIcons(['']);
  FluentInitIcons();
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      root,
    );
  }
});
postMessage({ payload: 'removeLoading' }, '*');
