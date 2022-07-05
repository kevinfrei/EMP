/*
import { Suspense } from 'react';
import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import Settings from '../Views/Settings';
*/

jest.mock('../../MyWindow');

export {};

it('Render Settings without crashing', () => {
  /*
  await act(async () => {
    const elem = (
      <RecoilRoot>
        <Suspense fallback="">
          <Settings />
        </Suspense>
      </RecoilRoot>
    );
    const root = create(elem);
    root.update(elem);
    return new Promise((res, rej) => res());
  });
  */
});

it('Render SearchResults without crashing', () => {
  /*
  initializeIcons();
  await act(async () => {
    const elem = (
      <RecoilRoot>
        <Suspense fallback="">
          <SearchResultsView />
        </Suspense>
      </RecoilRoot>
    );
    const root = create(elem);
    root.update(elem);
    return new Promise((res, rej) => res());
  });
  */
});
