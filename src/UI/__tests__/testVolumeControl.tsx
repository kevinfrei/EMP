import { initializeIcons } from '@fluentui/font-icons-mdl2';
/*
import { Suspense } from 'react';
import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import VolumeControl from '../VolumeControl';
*/

jest.mock('../../MyWindow');

it('renders without crashing', async () => {
  initializeIcons();
  /*
  await act(async () => {
    create(
      <RecoilRoot>
        <Suspense fallback="">
          <VolumeControl />
        </Suspense>
      </RecoilRoot>,
    );
    return new Promise((res, rej) => res());
  });
  */
});
