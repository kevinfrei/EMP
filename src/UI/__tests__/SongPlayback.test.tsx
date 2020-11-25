import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import SongPlayback from '../SongPlayback';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <SongPlayback />
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
