import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import AsyncDoodad from '../Utilities';

jest.mock('../../MyWindow');

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <RecoilRoot>
      <AsyncDoodad />
    </RecoilRoot>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
