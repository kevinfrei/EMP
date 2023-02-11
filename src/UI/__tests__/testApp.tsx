import { Suspense } from 'react';
import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import { FluentInitIcons } from '../../FluentInit';
import { MockERU } from '../../__mocks__/MyWindow';
import { SearchResultsView } from '../Views/SearchResults';
import { SettingsView } from '../Views/Settings';

jest.mock('../../MyWindow');
// Wire up a fake IPC object so I don't have to mock all teh stuff from @freik/elect-render-utilsX
beforeAll(MockERU);
beforeAll(FluentInitIcons);

it('Render Settings without crashing', async () => {
  await act(async () => {
    const elem = (
      <RecoilRoot>
        <Suspense fallback="">
          <SettingsView />
        </Suspense>
      </RecoilRoot>
    );
    const root = create(elem);
    root.update(elem);
    return new Promise((res) => res());
  });
});

it('Render SearchResults without crashing', async () => {
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
    return new Promise((res) => res());
  });
});
