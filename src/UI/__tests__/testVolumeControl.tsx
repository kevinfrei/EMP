import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import { FluentInitIcons } from '../../FluentInit';
import { MockERU } from '../../__mocks__/MyWindow';
import { VolumeControl } from '../VolumeControl';

jest.mock('../../MyWindow');
// Wire up a fake IPC object so I don't have to mock all teh stuff from @freik/elect-render-utilsX
beforeAll(MockERU);

it('renders without crashing', async () => {
  await act(async () => {
    FluentInitIcons();
    create(
      <RecoilRoot>
        <VolumeControl />
      </RecoilRoot>,
    );
    return new Promise((res) => res());
  });
});
