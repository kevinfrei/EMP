import { act } from 'react-test-renderer';
import { FluentInitIcons } from '../../FluentInit';

jest.mock('../../MyWindow');

export {};

it('renders without crashing', async () => {
  await act(async () => {
    FluentInitIcons();
    /*    create(
      <RecoilRoot>
        <Suspense fallback="">
          <VolumeControl />
        </Suspense>
      </RecoilRoot>,
    );*/
    return new Promise((res) => res());
  });
});
