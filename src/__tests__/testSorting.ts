import { MakeSortKey } from '../Sorting';

it('Basic Sort testing', () => {
  const sk = MakeSortKey('lrynt');
  expect(sk).toBeDefined();
});
