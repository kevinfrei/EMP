import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import Utilities, { Spinner } from '../Utilities';

jest.mock('../../MyWindow');

it('renders without crashing', async () => {
  await act(async () => {
    create(
      <RecoilRoot>
        <Spinner>
          <Utilities />
        </Spinner>
      </RecoilRoot>,
    );
    return new Promise((res, rej) => res());
  });
});
