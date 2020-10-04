// Take in a function that returns the string we're indexing from the object
// Return a trie of search terms
export type TrieNode<T> = {
  character: string;
  children: TrieMap<T>;
  values: Set<T>;
};
export type TrieMap<T> = Map<string, TrieNode<T>>;
export type Searchable<T> = (str: string, substrs?: boolean) => Iterable<T>;

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

/**
 * @function MakeIndex takes a collection of T's, and a "getter" that will
 * return the string that you want to index for each T, and return a "root"
 * trie node for use with general text searching
 * @param  {Iterable<T>} objects - the collection of objects to index
 * @param  {(arg:T)=>string} getter - accessor to get the indexable string for T
 * @returns {TrieNode<T>} The root of the trie node for string indexing
 */
export function MakeIndex<T>(
  objects: Iterable<T>,
  getter: (arg: T) => string,
): [TrieMap<T>, TrieMap<T>] {
  const wholeWords = new Map<string, TrieNode<T>>();
  const substrings = new Map<string, TrieNode<T>>();
  for (const o of objects) {
    const wholeString = getter(o);
    for (const str of wholeString.split(splitter)) {
      // We have a string for the object 'o' that needs to be added to the trie

      // This makes an index for only whole words
      if (str.length) {
        addToIndex(0, str, o, wholeWords);
      }
      // This will make the "substrings also" index:
      for (let i = 1; i < str.length; i++) {
        addToIndex(i, str, o, substrings);
      }
    }
  }
  return [wholeWords, substrings];
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
  return (str: string, substrs?: boolean): Iterable<T> => {
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
  };
}