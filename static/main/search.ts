// Take in a function that returns the string we're indexing from the object
// Return a trie of search terms

export type TrieNode<T> = {
  children: Map<string, TrieNode<T>>;
  values: Set<T>;
};

const splitter = /[- .;:]/;

function addToIndex<T>(
  idx: number,
  str: string,
  o: T,
  res: Map<string, TrieNode<T>>
) {
  let chr = str[idx].toLocaleUpperCase();
  let node = res.get(chr);
  if (!node) {
    node = { children: new Map(), values: new Set() };
    res.set(chr, node);
  }
  node.values.add(o);
  // If we haven't reached the end of the string, keep going
  if (idx + 1 < str.length) {
    addToIndex(idx + 1, str, o, node.children);
  }
}

export default function makeIndex<T>(
  objects: Iterable<T>,
  getter: (arg: T) => string
): Map<string, TrieNode<T>> {
  let res: Map<string, TrieNode<T>> = new Map();
  for (let o of objects) {
    const wholeString = getter(o);
    for (let str of wholeString.split(splitter)) {
      // We have a string for the object 'o' that needs to be added to the trie
      if (str.length) {
        addToIndex(0, str, o, res);
      }
    }
  }
  return res;
}
