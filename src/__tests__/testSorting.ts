import { MultiMap } from '@freik/core-utils';
import { MakeSortKey, MakeSortKeyMultiMap } from '../Sorting';

it('Basic Sort testing', () => {
  const sk = MakeSortKey('lrynt');
  expect(sk).toBeDefined();
});

function addMultiMapKeys(mm: MultiMap<string, number>): number {
  let totals = 0;
  mm.forEach((vals) =>
    vals.forEach((val) => {
      totals += val;
      if (val < 0) throw Error('index less than zero');
    }),
  );
  return totals;
}

it('SortKey map tests', () => {
  const flatMap = MakeSortKeyMultiMap('abcd');
  expect(flatMap.size()).toEqual(4);
  expect(addMultiMapKeys(flatMap)).toEqual(0);
  const twoMap = MakeSortKeyMultiMap(['ab', 'cd']);
  expect(twoMap.size()).toEqual(4);
  expect(addMultiMapKeys(twoMap)).toEqual(2);
  const dupeMap = MakeSortKeyMultiMap(['abc', 'cde']);
  expect(dupeMap.size()).toEqual(5);
  expect(addMultiMapKeys(dupeMap)).toEqual(3);
  const cVal = dupeMap.get('c');
  expect(cVal).toBeDefined();
  if (!cVal) throw Error('');
  expect(cVal.size).toEqual(2);

  const groupSpec1 = MakeSortKeyMultiMap('', ['abc', 'cde']);
  expect(dupeMap.toJSON()).toEqual(groupSpec1.toJSON());
  const groupSpec2 = MakeSortKeyMultiMap('', [
    ['a', [0]],
    ['b', [0]],
    ['c', [0, 1]],
  ]);
  expect(groupSpec2).toBeDefined();
  expect(addMultiMapKeys(groupSpec2)).toEqual(1);
  const groupSpec3 = MakeSortKeyMultiMap('', ['abc', 'bcd']);
  expect([...groupSpec3.keys()].length).toEqual(4);
  expect(addMultiMapKeys(groupSpec3)).toEqual(3);
});
