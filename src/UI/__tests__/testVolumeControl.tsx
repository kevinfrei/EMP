import { Suspense } from 'react';
import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import { FluentInitIcons } from '../../FluentInit';
import { VolumeControl } from '../VolumeControl';

jest.mock('../../MyWindow');
jest.mock('@freik/elect-render-utils');

it('renders without crashing', async () => {
  await act(async () => {
    FluentInitIcons();
    create(
      <RecoilRoot>
        <Suspense fallback="">
          <VolumeControl />
        </Suspense>
      </RecoilRoot>,
    );
    return new Promise((res) => res());
  });
});
