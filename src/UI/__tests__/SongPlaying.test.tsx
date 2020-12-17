import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import SongPlaying from '../SongPlaying';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <SongPlaying />
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
