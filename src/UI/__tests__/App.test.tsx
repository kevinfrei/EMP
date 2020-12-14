import { initializeIcons } from '@uifabric/icons';
import { Suspense } from 'react';
import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import SearchResultsView from '../Views/SearchResults';
import Settings from '../Views/Settings';

jest.mock('../../MyWindow');

it('Render Settings without crashing', async () => {
  initializeIcons();
  act(() => {
    create(
      <RecoilRoot>
        <Suspense fallback="">
          <Settings />
        </Suspense>
      </RecoilRoot>,
    );
  });
  await Settings;
});

it('Render SearchResults without crashing', async () => {
  initializeIcons();
  act(() => {
    create(
      <RecoilRoot>
        <Suspense fallback="">
          <SearchResultsView />
        </Suspense>
      </RecoilRoot>,
    );
  });
  await SearchResultsView;
});
