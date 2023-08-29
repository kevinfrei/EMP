import { MakeMultiMap } from '@freik/containers';
import { MakeLog } from '@freik/logger';
import { FileUtil, PathUtil as path } from '@freik/node-utils';
import { MaybeWait, OnlyOneActive } from '@freik/sync';
import { isArray, isDefined } from '@freik/typechk';
import { promises as fs } from 'fs';
import { h64 } from 'xxhashjs';

const { log } = MakeLog('BlobStore');

export type BlobStore<T> = {
  get(key: T): Promise<Buffer | void>;
  put(data: Buffer, key: T): Promise<void>;
  putMany(data: Buffer, key: Iterable<T>): Promise<void>;
  delete(key: T | T[]): Promise<void>;
  clear(): Promise<void>;
  flush(): Promise<void>;
};

export async function MakeBlobStore<T>(
  keyLookup: (key: T) => Promise<string> | string,
  storeLocation: string,
): Promise<BlobStore<T>> {
  // The directory of the blob store
  const blobStoreDir = path.trailingSlash(path.resolve(storeLocation));
  // The index of string-keys to blob files
  const blobIndex = path.join(blobStoreDir, 'index.txt');
  // We're using Sequence Numbers for blob names
  // so this gets a "path safe" file name for the blob
  function getPath(seqNum: string): string {
    return path.join(blobStoreDir, seqNum);
  }
  // hash key to filename lookup
  const keyToPath = new Map<string, string>();
  const pathToKeys = MakeMultiMap<string, string>();

  async function xlate(key: T): Promise<string> {
    return await MaybeWait(() => keyLookup(key));
  }

  try {
    const index = await FileUtil.textFileToArrayAsync(blobIndex);
    for (let i = 0; i < index.length; i += 2) {
      keyToPath.set(index[i], index[i + 1]);
      pathToKeys.set(index[i + 1], index[i]);
    }
  } catch (e) {
    keyToPath.clear();
    pathToKeys.clear();
  }

  const saveIndexInTheFuture = OnlyOneActive(async () => {
    const data = [...keyToPath].flat();
    log('Finally writing the index...');
    await FileUtil.arrayToTextFileAsync(data, blobIndex);
    log('Wrote the index');
  }, 250);

  // Save the index file back to disk
  async function saveIndex() {
    await saveIndexInTheFuture();
  }

  // Get the buffer from the disk store
  async function get(key: T): Promise<Buffer | void> {
    try {
      const hashKey = await xlate(key);
      const filepath = keyToPath.get(hashKey);
      if (isDefined(filepath)) {
        return await fs.readFile(getPath(filepath));
      }
    } catch (e) {
      // No file found...
    }
  }

  // Put a buffer on disk, with a set of keys (allowing many to one references)
  async function putMany(data: Buffer, keys: Iterable<T>): Promise<void> {
    const filename = 'BLOB-' + h64(data, 0x12481632).toString(36);
    try {
      log(`About to write the file: ${filename}`);
      await fs.writeFile(getPath(filename), data);
    } catch (e) {
      // This should handle conflicts, which hopefully never occur...
      /* istanbul ignore next */
      log(`Failed to write the file:`);
      /* istanbul ignore next */
      log(e);
    }
    for (const key of keys) {
      const xlateKey = await xlate(key);
      keyToPath.set(xlateKey, filename);
      pathToKeys.set(filename, xlateKey);
    }
    log('About to save the index');
    await saveIndex();
  }

  // Does what it says :D
  async function clear(): Promise<void> {
    try {
      await Promise.all(
        [...new Set(keyToPath.values())].map((fileName) =>
          fs.rm(getPath(fileName)),
        ),
      );
    } catch (e) {
      // We have have multiple files
    }
    keyToPath.clear();
    pathToKeys.clear();
    await saveIndexInTheFuture.trigger();
  }

  async function del(key: T | T[]): Promise<void> {
    const keys = isArray(key) ? key : [key];
    for (const k of keys) {
      const realKey = await xlate(k);
      const filename = keyToPath.get(realKey);
      if (filename) {
        keyToPath.delete(realKey);
        pathToKeys.remove(filename, realKey);
        if (pathToKeys.get(filename) === undefined) {
          await fs.rm(getPath(filename));
        }
      }
    }
    await saveIndex();
  }

  async function flush() {
    await saveIndexInTheFuture.trigger();
  }
  // TODO: Add a 'deduplication' function? Hash the buffers or something?

  return {
    get,
    put: (data: Buffer, key: T): Promise<void> => putMany(data, [key]),
    putMany,
    delete: del,
    clear,
    flush,
  };
}
