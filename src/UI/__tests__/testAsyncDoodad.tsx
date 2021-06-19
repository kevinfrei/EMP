import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import AsyncDoodad from '../Utilities';

jest.mock('../../MyWindow');

it('renders without crashing', async () => {
  await act(async () => {
    create(
      <RecoilRoot>
        <AsyncDoodad />
      </RecoilRoot>,
    );
    return new Promise((res, rej) => res());
  });
});
