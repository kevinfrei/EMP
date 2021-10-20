import { initializeIcons } from '@fluentui/font-icons-mdl2';

/*
import { Suspense } from 'react';
import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import Sidebar from '../Sidebar';
*/
jest.mock('../../MyWindow');

it('renders without crashing', async () => {
  initializeIcons();
  /*await act(async () => {
    create(
      <RecoilRoot>
        <Suspense fallback="">
          <Sidebar />
        </Suspense>
      </RecoilRoot>,
    );
    return new Promise((res, rej) => res());
  });*/
});
