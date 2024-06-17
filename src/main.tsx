// Note: This approach works with any SVG icon set, not just @fluentui/react-icons-mdl2
// import { Util } from '@freik/electron-render';
import { Util } from '@freik/electron-render';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FluentInitIcons } from './FluentInit';
import { App } from './UI/App';
import './UI/styles/index.css';

Util.SetInit(() => {
  // unregisterIcons(['']);
  FluentInitIcons();

  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
});
postMessage({ payload: 'removeLoading' }, '*');
