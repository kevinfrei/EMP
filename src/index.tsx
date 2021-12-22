import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { Util } from '@freik/elect-render-utils';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import App from './UI/App';
import './UI/styles/index.css';

Util.SetInit(() => {
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
