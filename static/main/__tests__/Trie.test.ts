import { MakeIndex, MakeSearchable, Searchable, TrieMap } from '../Search';

type ObjType = [number, string];

const objects: ObjType[] = [
  [1, 'test object'],
  [2, 'another test'],
  [3, 'third object'],
  [4, 'fourth detect'],
  [5, 'retest objection'],
];

let wholeTrie: TrieMap<ObjType>;
let substrTrie: TrieMap<ObjType>;

let searchable: Searchable<ObjType>;

it('Do some very simplistic Trie validation', () => {
  [wholeTrie, substrTrie] = MakeIndex(objects, (a) => a[1]);
  expect(wholeTrie.size).toBe(6);
  expect(substrTrie.size).toBe(13);
});

it('Searchable no crashy', () => {
  searchable = MakeSearchable(objects, (a) => a[1]);
});

it('Check whole word searches', () => {
  expect([...searchable('test')].length).toBe(2);
  expect([...searchable('object')].length).toBe(3);
  expect([...searchable('another')].length).toBe(1);
  expect([...searchable('third')].length).toBe(1);
  expect([...searchable('nope')].length).toBe(0);
});

it('Check substring searches', () => {
  expect([...searchable('test', true)].length).toBe(3);
  expect([...searchable('es', true)].length).toBe(3);
  expect([...searchable('ect', true)].length).toBe(4);
  expect([...searchable('nother', true)].length).toBe(1);
  expect([...searchable('hird', true)].length).toBe(1);
  expect([...searchable('ope', true)].length).toBe(0);
});
