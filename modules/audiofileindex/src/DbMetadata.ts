import { ArraySetEqual } from '@freik/helpers';
import { MakeLog } from '@freik/logger';
import { Attributes, FullMetadata } from '@freik/media-core';
import { Metadata } from '@freik/media-utils';
import { PathUtil, Persist } from '@freik/node-utils';
import { OnlyOneActive } from '@freik/sync';
import {
  Pickle,
  Unpickle,
  chkFieldType,
  chkOneOf,
  hasField,
  isArray,
  isArrayOfString,
  isBoolean,
  isBothOf,
  isNumber,
  isObjectNonNull,
  isObjectOfExactType,
  isString,
} from '@freik/typechk';
import path from 'path';

const { log, wrn } = MakeLog('@freik/audiodb:DbMetadata');

declare type NestedValue =
  | NestedObject
  | NestedValue[]
  | number
  | string
  | boolean;
declare type NestedObject = { [key: string]: NestedValue };

export type MinimumMetadata = { originalPath: string } & Partial<FullMetadata>;

function flatten(obj: NestedObject): Map<string, string> {
  const result = new Map<string, string>();
  const walkChildren = (prefix: string, data: NestedValue) => {
    if (isNumber(data)) {
      result.set(prefix, data.toString());
    } else if (isBoolean(data)) {
      result.set(prefix, data ? 'true' : 'false');
    } else if (isString(data)) {
      result.set(prefix, data);
    } else {
      const pfx = prefix.length > 0 ? prefix + '.' : prefix;
      if (isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          walkChildren(`${pfx}${i}`, data[i]);
        }
      } else if (isObjectNonNull(data)) {
        for (const i in data) {
          if (hasField(data, i)) {
            walkChildren(`${pfx}${i}`, data[i]);
          }
        }
      }
    }
  };
  walkChildren('', obj);
  return result;
}

export async function GetMediaInfo(
  mediaPath: string,
): Promise<Map<string, string>> {
  const trackInfo = await Metadata.RawMetadata(mediaPath);
  const maybeSimple = await Metadata.FromFileAsync(mediaPath);
  const simple: NestedObject = (maybeSimple as any as NestedObject) || {};
  const maybeFull = maybeSimple
    ? Metadata.FullFromObj(mediaPath, maybeSimple as any as Attributes)
    : null;
  const full: NestedObject = (maybeFull as NestedObject) || {};
  let res: Map<string, string>;
  if (isObjectNonNull(trackInfo) && !isArray(trackInfo)) {
    if (hasField(trackInfo, 'native')) {
      delete trackInfo.native;
    }
    if (hasField(trackInfo, 'quality')) {
      delete trackInfo.quality;
    }
    log('good metadata:');
    log(trackInfo);
    trackInfo.simple = simple;
    if (hasField(full, 'originalPath')) {
      delete full.originalPath;
    }
    trackInfo.full = full;
    res = flatten(trackInfo as NestedObject);
  } else {
    log('Bad metadata');
    delete full.originalPath;
    res = flatten({ simple, full });
  }
  res.set('File Path', mediaPath);
  return res;
}

export type MetadataStore = {
  get: (filepath: string) => MinimumMetadata | void;
  set: (filepath: string, md: MinimumMetadata) => void;
  merge: (filepath: string, md: MinimumMetadata) => void;
  overwrite: (filepath: string, md: MinimumMetadata) => void;
  fail: (filepath: string) => void;
  shouldTry: (filepath: string) => boolean;
  save: () => void;
  load: () => Promise<boolean>;
  flush: () => Promise<void>;
};

/**
 * Remove any fields/properties that are assigned to 'undefined' or null
 *
 * @param {unknown} obj - <bold>Mutates</bold> the object you wish to 'cleanse'
 * @param {boolean} [leaveNulls=true] should a null property be left alone
 *
 * @return {unknown} The 'cleansed' object (useful for chaining)
 */
function cleanseKeys(obj: unknown, leaveNulls?: boolean): unknown {
  if (!isObjectNonNull(obj)) {
    return obj;
  }
  for (const field of Object.keys(obj)) {
    if (
      hasField(obj, field) &&
      (obj[field] === undefined || (!leaveNulls && obj[field] === null))
    ) {
      delete obj[field];
    }
  }
  return obj;
}

const chkVaType = chkOneOf(
  (a): a is 'va' => a === 'va',
  (b): b is 'ost' => b === 'ost',
);

// Checks to make sure obj is a Partial<FullMetadata>
export function IsOnlyMetadata(obj: unknown): obj is MinimumMetadata {
  cleanseKeys(obj);
  return isObjectOfExactType(
    obj,
    {
      originalPath: isString,
    },
    {
      artist: chkOneOf(isString, isArrayOfString),
      album: isString,
      track: isNumber,
      title: isString,
      year: isNumber,
      vaType: chkVaType,
      moreArtists: isArrayOfString,
      variations: isArrayOfString,
      disk: isNumber,
      diskName: isString,
    },
  );
}
type StringMap = { [index: string]: undefined | string | number | string[] };

function minMetadataEqual(a: MinimumMetadata, b: MinimumMetadata): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (!ArraySetEqual(ak, bk)) {
    return false;
  }
  const aa: StringMap = a as StringMap;
  const bb: StringMap = b as StringMap;
  for (const k of Object.keys(aa)) {
    if (aa[k] === undefined && bb[k] === undefined) {
      continue;
    }
    if (isString(aa[k]) && isString(bb[k]) && aa[k] === bb[k]) {
      continue;
    }
    if (isArrayOfString(aa[k]) && isArrayOfString(bb[k])) {
      if (ArraySetEqual(aa[k] as string[], bb[k] as string[])) {
        continue;
      }
    }
    if (isNumber(aa[k]) && isNumber(bb[k]) && aa[k] === bb[k]) {
      continue;
    }
    return false;
  }
  return true;
}

export function IsFullMetadata(obj: unknown): obj is FullMetadata {
  cleanseKeys(obj);
  return isObjectOfExactType(
    obj,
    {
      originalPath: isString,
      artist: chkOneOf(isString, isArrayOfString),
      album: isString,
      track: isNumber,
      title: isString,
    },
    {
      year: isNumber,
      vaType: chkVaType,
      moreArtists: isArrayOfString,
      variations: isArrayOfString,
      disk: isNumber,
      diskName: isString,
    },
  );
}

function MakeMetadataStore(
  persist: Persist,
  name: string,
  rootLocation: string,
): MetadataStore {
  // The lookup for metadata
  const store = new Map<string, MinimumMetadata>();
  // A flag to keep track of if we've changed anything
  let dirty = false;
  // The set of stuff we've already attempted and failed to get MD for
  const stopTrying = new Set<string>();
  let loaded = false;
  const root = PathUtil.xplat(
    PathUtil.trailingSlash(path.resolve(rootLocation)).toLocaleUpperCase(),
  );

  function normalize(p: string): string {
    const maybeRel = PathUtil.xplat(
      path.resolve(path.isAbsolute(p) ? p : path.join(root, p)),
    ).toLocaleUpperCase();
    if (path.isAbsolute(maybeRel)) {
      if (!maybeRel.startsWith(root)) {
        throw new Error(
          `Invalid path in Metadata Store: "${p}": "${maybeRel}" [${root}]`,
        );
      } else {
        return maybeRel.substring(root.length);
      }
    }
    return maybeRel;
  }

  function get(filepath: string) {
    return store.get(normalize(filepath));
  }

  function set(filepath: string, md: MinimumMetadata) {
    const p = normalize(filepath);
    const curMd = get(p);
    if (curMd && minMetadataEqual(curMd, md)) {
      return;
    }
    dirty = true;
    store.set(p, { ...curMd, ...md });
    stopTrying.delete(p);
    void save();
  }
  function overwrite(filepath: string, md: MinimumMetadata) {
    const p = normalize(filepath);
    const curMd = get(p);
    if (curMd && minMetadataEqual(curMd, md)) {
      return;
    }
    dirty = true;
    store.set(p, md);
    stopTrying.delete(p);
    void save();
  }
  function fail(filepath: string) {
    const p = normalize(filepath);
    if (stopTrying.has(p)) {
      return;
    }
    dirty = true;
    stopTrying.add(p);
  }
  function shouldTry(filepath: string) {
    return !stopTrying.has(normalize(filepath));
  }
  const saverDelay = OnlyOneActive(async () => {
    log('Saving store back to disk');
    const valueToSave = {
      store: [...store.values()] as unknown,
      fails: [...stopTrying],
    };
    dirty = false;
    await persist.setItemAsync(name, Pickle(valueToSave));
  }, 250);
  function save() {
    if (!dirty) {
      log('Not saving: Store is not dirty');
      return;
    }
    void saverDelay();
  }
  async function load() {
    if (loaded) {
      return true;
    }
    const fromFile = await persist.getItemAsync(name);
    if (!fromFile) {
      log('MDS File Not Found: Empty store!');
      // Don't keep trying to load an empty file :)
      loaded = true;
      // But let's go ahead & save an 'empty' store instead of
      // the continuos "nothing on disk" state
      dirty = true;
      return true;
    }
    let valuesToRestore;
    try {
      valuesToRestore = Unpickle(fromFile);
    } catch (e) {
      wrn(`Invalid file format for MDS '${name}'`);
      return false;
    }
    if (
      !isBothOf(
        valuesToRestore,
        chkFieldType('store', isArray),
        chkFieldType('fails', isArrayOfString),
      )
    ) {
      log('MDS: Format failure');
      return false;
    }
    store.clear();
    let okay = true;
    valuesToRestore.store.forEach((val: unknown) => {
      if (IsOnlyMetadata(val)) {
        store.set(normalize(val.originalPath), val);
      } else {
        log(`MDS: failure for ${Pickle(val)}`);
        okay = false;
      }
    });
    stopTrying.clear();
    valuesToRestore.fails.forEach((val) => stopTrying.add(val));
    dirty = !okay;
    log(`MDS Load ${okay ? 'Success' : 'Failure'}`);
    loaded = okay;
    return okay;
  }
  return {
    get,
    set,
    merge: set,
    overwrite,
    fail,
    shouldTry,
    save,
    load,
    flush: async () => await saverDelay.trigger(),
  };
}

const mdcm: Map<string, MetadataStore> = new Map<string, MetadataStore>();

export async function GetMetadataStore(
  persist: Persist,
  name: string,
  rootLocation: string,
): Promise<MetadataStore> {
  let mdc = mdcm.get(name);
  if (!mdc) {
    mdc = MakeMetadataStore(persist, name, rootLocation);
    mdcm.set(name, mdc);
  }
  if (!(await mdc.load())) log(`Loading Metadata Store "${name}" failed`);
  return mdc;
}
/*
let mdSaveTimer: NodeJS.Timeout | null = null;

/**
 * @function setMediaInfoForSong
 * Responds to a request from the Render process with a flattened set of
 * partial metadata
 * @param  {string} flattenedData? - The (partial) metadata to be used to
 * override file name or internal metadata with
 * @returns Promise
 */
/*
export async function setMediaInfoForSong(
  audioDatabase: AudioDatabase,
  persist: Persist,
  metadataToUpdate: MinimumMetadata,
): Promise<void> {
  let fullPath: string = metadataToUpdate.originalPath;
  if (fullPath.startsWith('*')) {
    // This means we've got a SongKey instead of a path
    // Get the path from the database
    const sng = audioDatabase.getSong(fullPath.substring(1));
    if (!sng) {
      err('Unable to get the song for the song key for a metadata update');
      return;
    }
    fullPath = sng.path;
    metadataToUpdate.originalPath = fullPath;
  }
  const mdStore = await GetMetadataStore(persist, 'metadataOverride');

  const prevMd = mdStore.get(fullPath);
  mdStore.set(fullPath, { ...prevMd, ...metadataToUpdate });
  // commit the change to the music database
  await UpdateSongMetadata(audioDatabase, fullPath, {
    ...prevMd,
    ...metadataToUpdate,
  });

  // Debounced the whole file save
  if (mdSaveTimer !== null) {
    clearTimeout(mdSaveTimer);
  }
  mdSaveTimer = setTimeout(() => {
    mdStore.save().catch((e) => {
      err('unable to save media info');
      err(metadataToUpdate);
    });
  }, 250);
}

export async function getMediaInfoForSong(
  audioDatabase: AudioDatabase,
  key?: string,
): Promise<Map<string, string> | void> {
  if (!key || typeof key !== 'string') {
    return;
  }

  const song = audioDatabase.getSong(key);
  if (song) {
    const data: Map<string, string> = await getMediaInfo(song.path);
    log(`Fetched the media info for ${song.path}:`);
    log(data);
    return data;
  }
}
*/
