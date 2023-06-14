import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import { FluentInitIcons } from '../../FluentInit';
import { MockERU } from '../../__mocks__/MyWindow';
import { PlaybackControls } from '../PlaybackControls';

jest.mock('../../MyWindow');
// Wire up a fake IPC object so I don't have to mock all teh stuff from @freik/elect-render-utilsX
beforeAll(MockERU);
beforeAll(FluentInitIcons);

it('renders without crashing', async () => {
  await act(async () => {
    create(
      <RecoilRoot>
        <PlaybackControls audioRef={null} />
      </RecoilRoot>,
    );
    return new Promise((res) => res());
  });
});
