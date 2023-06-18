jest.mock('../../MyWindow');
// Wire up a fake IPC object so I don't have to mock all teh stuff from @freik/elect-render-utilsX
// beforeAll(MockERU);
// beforeAll(FluentInitIcons);

it('Render Settings without crashing', () => {
  /*
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
  });*/
});

it('Render SearchResults without crashing', () => {
  /*
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
  });*/
});
