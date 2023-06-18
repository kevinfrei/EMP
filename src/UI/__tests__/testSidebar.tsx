// import { MockERU } from '../../__mocks__/MyWindow';

jest.mock('../../MyWindow');
// Wire up a fake IPC object so I don't have to mock all teh stuff from @freik/elect-render-utilsX
// beforeAll(MockERU);
// beforeAll(FluentInitIcons);

it('renders without crashing', () => {
  /* await act(async () => {
    create(
      <RecoilRoot>
        <Suspense fallback="">
          <Sidebar />
        </Suspense>
      </RecoilRoot>,
    );
    return new Promise((res) => res());
  });*/
});
