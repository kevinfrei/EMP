/*
import { Suspense } from 'react';
import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import { Sidebar } from '../Sidebar';
*/
jest.mock('../../MyWindow');

export {};

it('renders without crashing', () => {
  // initializeIcons();
  /* await act(async () => {
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
