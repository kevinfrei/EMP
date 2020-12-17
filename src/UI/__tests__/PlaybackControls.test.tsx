import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import PlaybackControls from '../PlaybackControls';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <PlaybackControls />
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
