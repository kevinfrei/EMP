import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import SongControls from '../SongControls';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <SongControls />
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
