import { Type } from '@freik/core-utils';

export type TrieNode<T> = {
  character: string;
  children: TrieMap<T>;
  values: Set<T>;
};
export type TrieMap<T> = Map<string, TrieNode<T>>;
export type Searchable<T> = (str: string, substrs?: boolean) => Iterable<T>;
export type TrieTree<T> = [TrieMap<T>, TrieMap<T>];

/*
type Flattener<T> = (flattener: (obj: T) => FTONData) => FTONData;
export interface Searchable<T> {
  (str: string, substrs?: boolean): Iterable<T>;
  flatten(flattener: (obj: T) => FTONData): FTONData;
}
*/

const splitter = /[- .;:]/;

function makeNode<T>(character: string, o: T): TrieNode<T> {
  return {
    children: new Map<string, TrieNode<T>>(),
    values: new Set<T>([o]),
    character,
  };
}

function getOrMakeNode<T>(
  trieParent: TrieMap<T>,
  chr: string,
  o: T,
): TrieNode<T> {
  let maybeNode = trieParent.get(chr);
  if (!maybeNode) {
    maybeNode = makeNode<T>(chr, o);
    trieParent.set(chr, maybeNode);
  } else {
    maybeNode.values.add(o);
  }
  return maybeNode;
}

/**
 * @function Add str[idx] to the trie for object o
 * @param  {number} idx - the index of the string to add
 * @param  {string} str - the string being indexed
 * @param  {T} o - the object corresponding to the string
 * @param  {TrieNode<T>} trie - the trie for 'idx' to be added to
 */
function addToIndex<T>(idx: number, str: string, o: T, trieParent: TrieMap<T>) {
  const chr = str[idx].toLocaleUpperCase();
  const node: TrieNode<T> = getOrMakeNode(trieParent, chr, o);
  // If we haven't reached the end of the string, keep going
  if (idx + 1 < str.length) {
    addToIndex(idx + 1, str, o, node.children);
  }
}

// Typescript Overloading is kinda weird, but better than nothing...
/**
 * AddToIndex takes a collection of T's, and a "getter" that will
 * return the string that you want to index for each T, and adds the object
 * string to the index provided
 * @param {TrieTree<T>} trieTree - The root of the trie node for string indexing
 * @param {Iterable<T>} objects - the collection of objects to index
 * @param {(arg:T)=>string} getter - accessor to get the indexable string for T
 */
export function AddToIndex<T>(
  trieTree: TrieTree<T>,
  objects: Iterable<T>,
  getter: (arg: T) => string,
): void;
/**
 * AddToIndex takes a string you want to index, and the object T for
 * which that string is referring, and adds the string to the trie tree provided
 * @param {TrieTree<T>} trieTree - The root of the trie node for string indexing
 * @param {T} object - the object to index
 * @param {string} name - the 'name' of the object to index
 */
export function AddToIndex<T>(
  trieTree: TrieTree<T>,
  object: T,
  name: string,
): void;
export function AddToIndex<T>(
  trieTree: TrieTree<T>,
  objectOrObjects: T | Iterable<T>,
  nameOrGetter: string | ((arg: T) => string),
): void {
  function addStringToIndex(object: T, name: string) {
    for (const str of name.split(splitter)) {
      // We have a string for the object 'o' that needs to be added to the trie
      // This makes an index for only whole words
      if (str.length) {
        addToIndex(0, str, object, trieTree[0]);
      }
      // This will make the "substrings also" index:
      for (let i = 1; i < str.length; i++) {
        addToIndex(i, str, object, trieTree[1]);
      }
    }
  }
  if (Type.isString(nameOrGetter)) {
    addStringToIndex(objectOrObjects as T, nameOrGetter);
  } else {
    for (const o of objectOrObjects as Iterable<T>) {
      AddToIndex(trieTree, o, nameOrGetter(o));
    }
  }
}

/**
 * MakeIndex takes a collection of T's, and a "getter" that will
 * return the string that you want to index for each T, and return a "root"
 * trie node for use with general text searching
 * @param  {Iterable<T>} objects - the collection of objects to index
 * @param  {(arg:T)=>string} getter - accessor to get the indexable string for T
 * @returns {TrieTree<T>} The root of the trie node for string indexing
 */
export function MakeIndex<T>(
  objects: Iterable<T>,
  getter: (arg: T) => string,
): TrieTree<T>;
/**
 * MakeIndex returns a "root"
 * trie node for use with general text searching
 * @returns {TrieTree<T>} The root of the trie node for string indexing
 */
export function MakeIndex<T>(): TrieTree<T>;
export function MakeIndex<T>(
  objects?: Iterable<T>,
  getter?: (arg: T) => string,
): TrieTree<T> {
  const trieTree: TrieTree<T> = [
    new Map<string, TrieNode<T>>(),
    new Map<string, TrieNode<T>>(),
  ];
  if (objects && getter) {
    AddToIndex(trieTree, objects, getter);
  }
  return trieTree;
}

function SearchTrie<T>(str: string, trie: TrieMap<T>): Set<T> {
  let curMap: TrieMap<T> | null = trie;
  let theChild: TrieNode<T> | undefined;
  for (const c of str) {
    theChild = curMap.get(c.toUpperCase());
    if (theChild) {
      curMap = theChild.children;
    } else {
      break;
    }
  }
  if (theChild) {
    return theChild.values;
  }
  return new Set<T>();
}

function buildSearchable<T>(whole: TrieMap<T>, sub: TrieMap<T>): Searchable<T> {
  const searchFn = (str: string, substrs?: boolean): Iterable<T> => {
    // First, look in the whole-string index
    const wholeRes = SearchTrie(str, whole);
    if (!substrs) return wholeRes.values();
    const subRes = SearchTrie(str, sub);
    if (subRes.size < wholeRes.size) {
      subRes.forEach((val: T) => wholeRes.add(val));
      return wholeRes.values();
    } else {
      wholeRes.forEach((val: T) => subRes.add(val));
      return subRes.values();
    }
  }; /*
  const flattenIndex = (
    idx: TrieMap<T>,
    flattener: (obj: T) => FTONData,
  ): FTONData => {
    return new Map(
      [...idx.entries()].map(([str, node]) => [
        str,
        {
          c: node.character,
          v: [...node.values].map(flattener),
          m: flattenIndex(node.children, flattener),
        },
      ]),
    );
  };
  const flattenFn = (flattener: (obj: T) => FTONData): FTONData => {
    return [flattenIndex(whole, flattener), flattenIndex(sub, flattener)];
  };
  searchFn.flatten = flattenFn;
  */
  return searchFn;
}

/**
 * This makes a searchable index of the collection of objects passed in,
 * given the string(s) returned by the getter
 * @param  {Iterable<T>} objects - The objects to search
 * @param  {(arg:T)=>string} getter - The string data that refers to the object
 * @returns {Searchable<T>} - a function that takes a string and an optional
 * boolean to indicate whether to search substrings or just whole strings
 */
export function MakeSearchable<T>(
  objects: Iterable<T>,
  getter: (arg: T) => string,
): Searchable<T> {
  const [whole, sub] = MakeIndex(objects, getter);
  return buildSearchable(whole, sub);
}
/*
export function UnflattenSearchable<T>(
  flattened: FTONData,
  exploder: (data: FTONData) => T,
): Searchable<T> | string {
  const explodeIndex = (data: FTONData): TrieMap<T> | string => {
    if (!Type.isMap(data)) return "TrieMap<T> isn't actually a map";
    let error = '';
    const newMap = [...data.entries()].map(([key, value]) => {
      let newKey = key;
      if (!Type.isString(key)) {
        newKey = key.toString();
      }
      let character = '';
      if (!ObjUtil.hasStr('c', value)) {
        error += '\nMissing character';
      } else {
        character = value.c;
      }
      const children = new Map<string, TrieNode<T>>();
      const values = new Set<T>();
      const newValue: TrieNode<T> = { character, children, values };
      return [newKey, newValue];
    });
    if (error.length > 0) return error;
    return new Map<string, TrieNode<T>>(newMap);
  };
  if (!Type.isArray(flattened)) return 'Invalid top index element';
  if (flattened.length !== 2) return 'Invalide top length';
  const whole = explodeIndex(flattened[0]);
  const sub = explodeIndex(flattened[1]);
  if (Type.isString(whole)) return whole;
  if (Type.isString(sub)) return sub;
  return buildSearchable(whole, sub);
}
*/
