import { MakeMultiMap, MultiMap, chkMultiMapOf } from '@freik/containers';
import { SetIntersection } from '@freik/helpers';
import { MakeLog } from '@freik/logger';
import {
  FullMetadata,
  MediaKey,
  SimpleMetadata,
  SongKey,
  isSongKey,
} from '@freik/media-core';
import { Covers, Metadata } from '@freik/media-utils';
import {
  FileUtil,
  MakeFileIndex,
  MakePersistence,
  MakeSuffixWatcher,
  Persist,
  Watcher,
  PathUtil as path,
} from '@freik/node-utils';
import { MaybeWait } from '@freik/sync';
import {
  FromB64,
  NormalizedStringCompare,
  ToB64,
  ToPathSafeName,
} from '@freik/text';
import {
  FreikTypeTag,
  Pickle,
  SafelyUnpickle,
  isDefined,
  isFunction,
  isNumber,
  isString,
} from '@freik/typechk';
import { constants as FS_CONST, promises as fsp } from 'fs';
import { isAbsolute } from 'path';
import { h32 } from 'xxhashjs';
import { MakeBlobStore } from './BlobStore.js';
import {
  GetMetadataStore,
  IsFullMetadata,
  MinimumMetadata,
} from './DbMetadata.js';
import { IgnoreType, chkIgoreType } from './types.js';

const { wrn, log } = MakeLog('AudioFileIndex');

type PathHandlerAsync = (pathName: string) => Promise<void>;
type PathHandlerSync = (pathName: string) => void;
type PathHandlerBoth = (pathName: string) => Promise<void> | void;
type PathHandlerEither = PathHandlerSync | PathHandlerAsync | PathHandlerBoth;

export type AudioFileIndex = {
  getHashForIndex(): string; // basic test
  getLocation(): string; // basic test
  makeSongKey(songPath: string): SongKey; // basic test
  forEachAudioFile(fn: PathHandlerEither): Promise<void>;
  forEachAudioFileSync(fn: PathHandlerSync): void; // basic test
  getLastScanTime(): Date | null;
  // When we rescan files, look at file path diffs
  rescanFiles(
    addAudioFile?: PathHandlerEither,
    delAudioFile?: PathHandlerEither,
  ): Promise<void>;
  updateMetadata(newMetadata: MinimumMetadata): void;
  getMetadataForSong(filePath: string): Promise<FullMetadata | void>;
  setImageForSong(filePathOrKey: SongKey, buf: Buffer): Promise<void>;
  getImageForSong(
    filePathOrKey: SongKey,
    preferInternal?: boolean,
  ): Promise<Buffer | void>;
  destroy(): void;
  [FreikTypeTag]: symbol;
  // Ignore items in the AFI:
  addIgnoreItem(which: IgnoreType, value: string): void;
  removeIgnoreItem(which: IgnoreType, value: string): boolean;
  getIgnoreItems(): IterableIterator<[IgnoreType, string]>;
};

const AFITypeTag = Symbol.for('freik.AudioFileIndexTag');

// Helpers for the file list stuff
// emp => A JSON file pointing to another file, with (maybe) metadata overrides
const audioTypes = MakeSuffixWatcher('flac', 'mp3', 'aac', 'm4a', 'emp');
// Any other image types to care about?
const imageTypes = MakeSuffixWatcher('png', 'jpg', 'jpeg', 'heic', 'hei');
function watchTypes(pathName: string) {
  return (
    imageTypes(pathName) ||
    (audioTypes(pathName) && !path.basename(pathName).startsWith('.'))
  );
}

async function isWritableDir(pathName: string): Promise<boolean> {
  try {
    await fsp.access(pathName, FS_CONST.W_OK);
    const s = await fsp.stat(pathName);
    return s.isDirectory();
  } catch (e) {
    return false;
  }
}

// An "audio data fragment" is a list of files and metadata info.
// The idea is that it should be a handful of files to read, instead of an
// entire directory structure to scan (i.e. fast, and easy to update)

// An ADF should be fed into the Music Scanner,
// which adds the fragment to the database.

// For cache's, song-specific preferences, and metadata overrides,
// they should be routed to the appropriate MDF to update.

// "Static" data for looking up stuff across multiple indices
type IndexLocation = { location: string; index: AudioFileIndex };
const lengthSortedPaths: IndexLocation[] = [];
const indexKeyLookup = new Map<string, AudioFileIndex | null>();

// Given a song key, this finds the file index that contains
// SongKey's are formatted like this: S{hash-b16384}:{key-b64}
export function GetIndexForKey(key: SongKey): AudioFileIndex | void {
  const indexPortion = key.substring(1, key.indexOf(':'));
  const res = indexKeyLookup.get(indexPortion);
  if (res) return res;
}

export function GetIndexForPath(pathName: string): AudioFileIndex | void {
  for (const { location, index } of lengthSortedPaths) {
    if (
      NormalizedStringCompare(
        pathName.substring(0, location.length),
        location,
      ) === 0
    ) {
      return index;
    }
  }
}

// Adds an index with the given hash value and location
// It returns the encoded hash value for the location
function addIndex(
  hashValue: number | string,
  location: string,
  index: AudioFileIndex,
): string {
  let b64 = isString(hashValue) ? hashValue : ToB64(hashValue);
  while (isNumber(hashValue) && indexKeyLookup.has(b64)) {
    const idx = indexKeyLookup.get(b64);
    if (idx === index || index.getLocation() === location) {
      if (idx !== index) {
        indexKeyLookup.set(b64, index);
      }
      return b64;
    }
    // There's a hash conflict :/
    /* istanbul ignore next */
    b64 = ToB64(h32(hashValue).update(location).digest().toNumber());
  }
  indexKeyLookup.set(b64, index);
  let i = 0;
  for (; i < lengthSortedPaths.length; i++) {
    if (lengthSortedPaths[i].location.length >= i) {
      break;
    }
  }
  lengthSortedPaths.splice(i, 0, { location, index });
  return b64;
}

// Remove the index from the location list
// It hangs out in the WeakMap, cuz why not...
function delIndex(index: AudioFileIndex) {
  // remove it from the path list
  const loc = index.getLocation();
  for (let i = 0; i < lengthSortedPaths.length; i++) {
    if (lengthSortedPaths[i].index === index) {
      if (lengthSortedPaths[i].location !== loc) {
        /* istanbul ignore next */
        wrn(`Index and location are mismatched for ${loc}`);
      }
      lengthSortedPaths.splice(i, 1);
      break;
    }
  }
  // Clear it from the map
  // We don't delete it for consistent hashing? I haven't though through
  // collisions very well :/
  indexKeyLookup.delete(index.getHashForIndex());
}

// Helper for the file watcher stuff
async function maybeCallAndAdd(
  checker: (arg: string) => boolean,
  theSet: Set<string>,
  pathName: string,
  func?: PathHandlerEither,
): Promise<void> {
  if (checker(pathName)) {
    if (func) {
      await MaybeWait(() => func(pathName));
    }
    theSet.add(pathName);
  }
}

async function loadIgnoreItems(
  persist: Persist,
): Promise<MultiMap<IgnoreType, string>> {
  const data = (await persist.getItemAsync('ignore-items')) || '0';
  return (
    SafelyUnpickle(data, chkMultiMapOf(chkIgoreType, isString)) ||
    MakeMultiMap()
  );
}

async function saveIgnoreItems(
  persist: Persist,
  ignoreItems: MultiMap<IgnoreType, string>,
): Promise<void> {
  try {
    await persist.setItemAsync('ignore-items', Pickle(ignoreItems));
  } catch (e) {
    wrn(e);
  }
}

export type AudioFileIndexOptions = {
  readOnlyFallbackLocation: string;
  fileWatchFilter: Watcher;
  watchHidden: boolean;
};

// The constructor for an AudioFileIndex
// It takes a file location name, a "hash" for that location (ideally, one that's
// stable *across operatings systems* and a potential location for where to
// store metadata & whatnot if the file system is read-only
export async function MakeAudioFileIndex(
  locationName: string,
  fragmentHash: number | string,
  options?: Partial<AudioFileIndexOptions>,
): Promise<AudioFileIndex> {
  /*
   * "member" data goes here
   */
  const rootLocation = path.trailingSlash(path.resolve(locationName));
  // IIFE
  const tmpPersist = await (async () => {
    const pathName = path.join(rootLocation, '.afi');
    try {
      if (!(await isWritableDir(pathName))) {
        const str = await fsp.mkdir(pathName, { recursive: true });
        if (isString(str)) {
          // If we created the folder, we also want to hide it, cuz turd files
          // are truly annoying
          await FileUtil.hideFile(pathName);
        }
      }
      return MakePersistence(pathName);
    } catch (e) {
      // Probably a read only file system
    }
    // For readonly stuff, use the fallback location
    if (isDefined(options) && isString(options.readOnlyFallbackLocation)) {
      return MakePersistence(path.resolve(options.readOnlyFallbackLocation));
    } else {
      throw new Error(`Non-writable location: ${locationName}`);
    }
  })();
  const watchFilter = options?.fileWatchFilter;

  function ignoreWatchFilter(filepath: string): boolean {
    // Read the ignore info and check to see if this path should be ignored
    const pathroots = data.ignoreItems.get('path-root');
    if (isDefined(pathroots)) {
      for (const pathroot of pathroots) {
        if (filepath.toLowerCase().startsWith(pathroot.toLowerCase())) {
          return false;
        }
      }
    }
    const dirnames = data.ignoreItems.get('dir-name');
    if (isDefined(dirnames)) {
      const pieces = new Set<string>(
        filepath.split(/\/|\\/).map((str) => str.toLowerCase()),
      );
      if (SetIntersection(pieces, dirnames).size > 0) {
        return false;
      }
    }
    const pathkeywords = data.ignoreItems.get('path-keyword');
    if (isDefined(pathkeywords)) {
      const lcase = filepath.toLowerCase();
      for (const pathkw of pathkeywords) {
        if (lcase.indexOf(pathkw) >= 0) {
          return false;
        }
      }
    }
    return true;
  }

  function makeFilteredWatcher(w: Watcher): Watcher {
    if (isFunction(watchFilter)) {
      return (fullpath: string) => {
        if (!ignoreWatchFilter(fullpath)) {
          return false;
        }
        let o = fullpath;
        if (isAbsolute(o)) {
          if (!o.startsWith(rootLocation)) {
            wrn('Well shit!');
            return false;
          }
          o = o.substring(rootLocation.length - 1);
        } else {
          o = '/' + o;
        }
        return watchFilter(o) && w(o);
      };
    } else {
      return (obj: string) => ignoreWatchFilter(obj) && w(obj);
    }
  }
  const ignoreItems = await loadIgnoreItems(tmpPersist);
  const data = {
    songList: new Array<string>(),
    picList: new Array<string>(),
    lastScanTime: ((): Date | null => null)(), // IIFE instead of a full type
    location: rootLocation,
    indexHashString: '',
    persist: tmpPersist,
    fileIndex: await MakeFileIndex(rootLocation, {
      fileWatcher: makeFilteredWatcher(watchTypes), // TODO: Include ignore items
      indexFolderLocation: path.join(tmpPersist.getLocation(), 'fileIndex.txt'),
      watchHidden: true, // We need this to see hidden cover images...
    }),
    metadataCache: await GetMetadataStore(
      tmpPersist,
      'metadataCache',
      rootLocation,
    ),
    metadataOverride: await GetMetadataStore(
      tmpPersist,
      'metadataOverride',
      rootLocation,
    ),
    // A hash table of h32's to path-names
    existingSongKeys: new Map<number, string>(),
    pictures: await MakeBlobStore(
      (key: MediaKey) => ToPathSafeName(key),
      path.join(rootLocation, 'images'),
    ),
    fileSystemPictures: new Map<string, string>(),
    // The map of ignore items
    ignoreItems,
  };

  function addIgnoreItem(which: IgnoreType, value: string): void {
    data.ignoreItems.set(which, value);
    void saveIgnoreItems(data.persist, data.ignoreItems);
  }

  function removeIgnoreItem(which: IgnoreType, value: string): boolean {
    const res = data.ignoreItems.remove(which, value);
    void saveIgnoreItems(data.persist, data.ignoreItems);
    return res;
  }

  function* getIgnoreItems(): IterableIterator<[IgnoreType, string]> {
    for (const [it, setOfData] of data.ignoreItems) {
      for (const vl of setOfData) {
        yield [it, vl];
      }
    }
  }

  // "this"
  const res: AudioFileIndex = {
    // Don't know if this is necessary
    getHashForIndex: () => data.indexHashString,
    getLocation: () => data.location,
    getLastScanTime: () => data.lastScanTime,
    makeSongKey,
    forEachAudioFile,
    forEachAudioFileSync: (fn: PathHandlerSync) =>
      data.songList.forEach((pn) => fn(getFullPath(pn))),
    rescanFiles,
    updateMetadata,
    getMetadataForSong,
    getImageForSong,
    setImageForSong,
    destroy: () => {
      delIndex(res);
    },
    [FreikTypeTag]: AFITypeTag,
    addIgnoreItem,
    removeIgnoreItem,
    getIgnoreItems,
  };
  data.indexHashString = addIndex(fragmentHash, data.location, res);
  data.fileIndex.forEachFileSync((pathName: string) => {
    if (audioTypes(pathName)) {
      data.songList.push(pathName);
    } else {
      data.picList.push(pathName);
    }
  });
  await handleAlbumCovers();
  data.lastScanTime = new Date();
  // public
  async function forEachAudioFile(fn: PathHandlerEither): Promise<void> {
    for (const song of data.songList) {
      await MaybeWait(() => fn(getFullPath(song)));
    }
  }

  // Pull out a relative path that we can use as an OS agnostic locater
  function getRelativePath(songPath: string): string {
    const absPath = getFullPath(songPath);
    /* istanbul ignore next */
    if (!absPath.startsWith(data.location)) {
      throw Error(`Invalid prefix ${data.location} for songPath ${absPath}`);
    }
    return absPath.substring(data.location.length);
  }

  // From a (possibly) relative path, get something we can read data from
  function getFullPath(relPath: string): string {
    return isAbsolute(path.xplat(relPath))
      ? path.resolve(relPath)
      : path.resolve(path.join(data.location, relPath));
  }

  // This will return the AFI hash and the songkey hash,
  // or false if the thing isn't a songkey
  function getAFIKey(keyorpath: string): [number, number] | false {
    try {
      if (
        keyorpath[0] === 'S' ||
        keyorpath[0] === 'L' ||
        keyorpath[0] === 'R'
      ) {
        const split = keyorpath.indexOf(':');
        if (split > 1) {
          // If we've made it this far, the exception path is fine; odds are
          // it's a song key, so it's not likely to raise an exception
          // Windows paths won't match, because we're not allowing a colon
          // at index 1: It has to be greater than index 1
          const indexNum = FromB64(keyorpath.substring(1, split));
          const keyNum = FromB64(keyorpath.substring(split + 1));
          return [indexNum, keyNum];
        }
      }
    } catch (e) {} // eslint-disable-line no-empty
    return false;
  }

  // Given either a key or a path, this returns a full path
  function pathFromKeyOrPath(keyorpath: string): string {
    // First, pull out the number from the key
    if (isSongKey(keyorpath)) {
      const keyData = getAFIKey(keyorpath);
      if (
        keyData !== false &&
        ToB64(keyData[0]) === data.indexHashString &&
        data.existingSongKeys.has(keyData[1])
      ) {
        const relPath = data.existingSongKeys.get(keyData[1]);
        if (relPath) {
          return getFullPath(relPath);
        }
      }
    }
    // If this doesn't throw an exception, we're golden
    makeSongKey(keyorpath);
    return getFullPath(keyorpath);
  }

  // This *should* be pretty stable, with the rare exceptions of hash collisions
  // public
  function makeSongKey(songPath: string): SongKey {
    const relPath = getRelativePath(songPath);
    let hash = h32(relPath, 0xbadf00d).toNumber();
    while (data.existingSongKeys.has(hash)) {
      const val = data.existingSongKeys.get(hash);
      if (isString(val) && NormalizedStringCompare(val, relPath) === 0) {
        break;
      }
      // err(`songKey hash collision: "${relPath}" with "${val || 'undefined'}"`);
      // Feed the old hash into the new hash to get a new value, cuz y not?
      // err(`Location: ${data.location}`);
      /* istanbul ignore next */
      hash = h32(songPath, hash).toNumber();
    }
    data.existingSongKeys.set(hash, relPath);
    return `S${data.indexHashString}:${ToB64(hash)}`;
  }

  function updateList(
    list: string[],
    adds: Set<string>,
    dels: Set<string>,
  ): string[] {
    return list.concat([...adds]).filter((val) => !dels.has(val));
  }

  // public
  async function rescanFiles(
    addAudioFile?: PathHandlerEither,
    delAudioFile?: PathHandlerEither,
  ) {
    const audioAdds = new Set<string>();
    const imageAdds = new Set<string>();
    const audioDels = new Set<string>();
    const imageDels = new Set<string>();
    await data.fileIndex.rescanFiles(
      async (pathName: string) => {
        await maybeCallAndAdd(
          makeFilteredWatcher(audioTypes),
          audioAdds,
          pathName,
          addAudioFile,
        );
        await maybeCallAndAdd(
          makeFilteredWatcher(imageTypes),
          imageAdds,
          pathName,
        );
      },
      async (pathName: string) => {
        await maybeCallAndAdd(audioTypes, audioDels, pathName, delAudioFile);
        await maybeCallAndAdd(imageTypes, imageDels, pathName);
      },
    );
    data.songList = updateList(data.songList, audioAdds, audioDels);
    data.picList = updateList(data.picList, imageAdds, imageDels);
    await handleAlbumCovers();
    data.lastScanTime = new Date();
  }

  // public
  async function getMetadataForSong(
    pathName: string,
  ): Promise<FullMetadata | void> {
    const relPath = getRelativePath(pathName);
    // If we've previously failed doing anything with this file, don't keep
    // banging our head against a wall
    if (!data.metadataCache.shouldTry(relPath)) {
      return;
    }
    // Cached data overrides file path acquired metadata
    const mdOverride = data.metadataOverride.get(relPath);
    const littlemd = Metadata.FromPath(relPath);
    if (littlemd) {
      const fullPath = getFullPath(relPath);
      const pathMd = Metadata.FullFromObj(fullPath, littlemd);
      const md = { ...pathMd, ...mdOverride, originalPath: fullPath };

      if (IsFullMetadata(md)) {
        return md;
      }
    }
    // This does some stuff about trying harder for files that don't parse right
    let maybeMetadata: SimpleMetadata | void | null = null;
    try {
      maybeMetadata = await Metadata.FromFileAsync(getFullPath(relPath));
    } catch (e) {
      /* istanbul ignore next */
      wrn(`Failed acquiring metadata from ${relPath}:`);
      /* istanbul ignore next */
      wrn(e);
    }
    if (!maybeMetadata) {
      log(`Complete metadata failure for ${relPath}`);
      data.metadataCache.fail(relPath);
      return;
    }
    const fullMd = Metadata.FullFromObj(getFullPath(relPath), maybeMetadata);
    /* istanbul ignore if */
    if (!fullMd) {
      log(`Partial metadata failure for ${relPath}`);
      data.metadataCache.fail(relPath);
      return;
    }
    const overridden = { ...fullMd, ...mdOverride };
    data.metadataCache.set(relPath, overridden);
    // Don't need to wait on this one:
    void data.metadataCache.save();
    return overridden;
  }

  // public
  function updateMetadata(newMetadata: MinimumMetadata): void {
    const relName = getRelativePath(newMetadata.originalPath);
    data.metadataOverride.set(relName, {
      ...newMetadata,
      originalPath: relName,
    });
  }

  // public
  async function setImageForSong(
    keyOrPath: SongKey,
    buf: Buffer,
  ): Promise<void> {
    const key = getAFIKey(keyOrPath) ? keyOrPath : makeSongKey(keyOrPath);
    await data.pictures.put(buf, key);
  }

  async function loadCoverFromFile(fullPath: string): Promise<Buffer | void> {
    // TODO: Maybe keep track of which files we've already read from,
    // so we can skip this step in the future, yes?
    // Or instead leave this up to the AFI consumer to implement?
    try {
      const maybeData = await Covers.ReadFromFile(fullPath);
      if (maybeData) {
        const buffer = Buffer.from(maybeData.data, 'base64');
        // TODO: Save this outside the file, right?
        return buffer;
      }
    } catch (e: unknown) {
      /* nothing here, I guess: Windows + git + file names like Bjork = misery */
    }
  }
  // public
  async function getImageForSong(
    keyOrPath: SongKey,
    preferInternal?: boolean,
  ): Promise<Buffer | void> {
    const key = getAFIKey(keyOrPath) ? keyOrPath : makeSongKey(keyOrPath);
    // first check the blob-store
    const maybe = await data.pictures.get(key);
    if (maybe) {
      return maybe;
    }

    // Next, check the song (if preferred)
    const fullPath = pathFromKeyOrPath(keyOrPath);
    const relPath = getRelativePath(fullPath);
    if (preferInternal) {
      const maybeBuffer = await loadCoverFromFile(fullPath);
      if (maybeBuffer) {
        return maybeBuffer;
      }
    }
    // Check for a folder-hosted image
    const maybeFile = data.fileSystemPictures.get(relPath);
    if (maybeFile) {
      const fullpath = getFullPath(maybeFile);
      return await fsp.readFile(fullpath);
    }
    // We didn't find folder-hosted image, check the file if we didn't earlier
    if (!preferInternal) {
      return await loadCoverFromFile(fullPath);
    }
  }

  async function handleAlbumCovers() {
    // Get all pictures from each directory.
    // Find the biggest and make it the album picture for any albums in that dir

    const dirsToPics = MakeMultiMap<string, string>();
    const dirsToSongs = MakeMultiMap<string, string>();
    data.picList.forEach((p) => {
      const dirName = path.dirname(p);
      dirsToPics.set(dirName, p);
    });
    data.songList.forEach((p) => {
      const dirName = path.dirname(p);
      dirsToSongs.set(dirName, getRelativePath(p));
    });

    // Now, for each dir, find the biggest file and dump it in the database
    // for each album that has stuff in that directory
    type SizeAndName = { size: number; name: string };

    data.fileSystemPictures.clear();
    await dirsToPics.forEachAwaitable(async (setOfFiles, dirName) => {
      const songs = dirsToSongs.get(dirName);
      if (songs) {
        let largest: SizeAndName = { size: 0, name: '' };
        for (const cur of setOfFiles) {
          try {
            const fullPath = getFullPath(cur);
            const fileStat = await fsp.stat(fullPath);
            if (fileStat.size > largest.size) {
              largest = { size: fileStat.size, name: cur };
            }
            // eslint-disable-next-line no-empty
          } catch (e) {
            /* istanbul ignore next */
            wrn('Error!');
            /* istanbul ignore next */
            wrn(e);
          }
        }
        // Now, for each file, set it's cover to the largest file
        songs.forEach((song) => {
          if (largest.name) {
            data.fileSystemPictures.set(song, largest.name);
          }
        });
      }
    });
  }

  return res;
}
