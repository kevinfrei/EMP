import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import SongPlaying from '../SongPlaying';

jest.mock('../../MyWindow');

it('renders without crashing', async () => {
  await act(async () => {
    create(
      <RecoilRoot>
        <SongPlaying />
      </RecoilRoot>,
    );
    return new Promise((res, rej) => res());
  });
});
