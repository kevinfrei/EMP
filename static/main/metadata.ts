import {
  MakeError,
  MakeLogger,
  ObjUtil,
  Operations,
  Pickle,
  Type,
  Unpickle,
} from '@freik/core-utils';
import { Attributes, FullMetadata } from '@freik/media-core';
import { Metadata as MD } from '@freik/media-utils';
import { getMusicDB } from './MusicAccess';
import { UpdateSongMetadata } from './MusicScanner';
import { Persistence } from './persist';

const log = MakeLogger('metadata');
const err = MakeError('metadata-err');

declare type NestedValue =
  | NestedObject
  | NestedValue[]
  | number
  | string
  | boolean;
declare type NestedObject = { [key: string]: NestedValue };

export type MinimumMetadata = Partial<FullMetadata> & { originalPath: string };

function flatten(obj: NestedObject): Map<string, string> {
  const result = new Map<string, string>();
  const walkChildren = (prefix: string, data: NestedValue) => {
    if (Type.isNumber(data)) {
      result.set(prefix, data.toString());
    } else if (Type.isBoolean(data)) {
      result.set(prefix, data ? 'true' : 'false');
    } else if (Type.isString(data)) {
      result.set(prefix, data);
    } else {
      const pfx = prefix.length > 0 ? prefix + '.' : prefix;
      if (Type.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          walkChildren(`${pfx}${i}`, data[i]);
        }
      } else if (Type.isObject(data)) {
        for (const i in data) {
          if (ObjUtil.has(i, data)) {
            walkChildren(`${pfx}${i}`, data[i]);
          }
        }
      }
    }
  };
  walkChildren('', obj);
  return result;
}

export async function getMediaInfo(
  mediaPath: string,
): Promise<Map<string, string>> {
  const trackInfo = await MD.RawMetadata(mediaPath);
  const maybeSimple = await MD.FromFileAsync(mediaPath);
  const simple: NestedObject = (maybeSimple as any as NestedObject) || {};
  const maybeFull = maybeSimple
    ? MD.FullFromObj(mediaPath, maybeSimple as any as Attributes)
    : null;
  const full: NestedObject = (maybeFull as NestedObject) || {};
  let res: Map<string, string>;
  if (Type.isObjectNonNull(trackInfo)) {
    delete trackInfo.native;
    delete trackInfo.quality;
    log('good metadata:');
    log(trackInfo);
    trackInfo.simple = simple;
    trackInfo.full = full;
    delete trackInfo.full.originalPath;
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
  get: (path: string) => MinimumMetadata | void;
  set: (path: string, md: MinimumMetadata) => void;
  fail: (path: string) => void;
  shouldTry: (path: string) => boolean;
  save: () => Promise<void>;
  load: () => Promise<boolean>;
};

const fullMetadataKeys: Map<string, (obj: unknown) => boolean> = new Map<
  string,
  (obj: unknown) => boolean
>([
  ['originalPath', Type.isString],
  ['artist', (obj: unknown) => Type.isString(obj) || Type.isArrayOfString(obj)],
  ['album', Type.isString],
  ['year', Type.isNumber],
  ['track', Type.isNumber],
  ['title', Type.isString],
  ['vaType', (obj: unknown) => obj === 'va' || obj === 'ost'],
  ['moreArtists', Type.isArrayOfString],
  ['variations', Type.isArrayOfString],
  ['disk', Type.isNumber],
  ['diskName', Type.isString],
]);

const mandatoryMetadataKeys: string[] = [
  'originalPath',
  'artist',
  'album',
  'track',
  'title',
];

// Checks to make sure obj is a Partial<FullMetadata>
export function isOnlyMetadata(obj: unknown): obj is MinimumMetadata {
  if (!Type.isObjectNonNull(obj)) {
    err("object isn't non-null");
    err(obj);
    return false;
  }
  for (const fieldName of Object.keys(obj)) {
    if (obj[fieldName] === undefined || obj[fieldName] === null) {
      delete obj[fieldName];
      continue;
    }
    const fieldTypeChecker = fullMetadataKeys.get(fieldName);
    if (!fieldTypeChecker) {
      err(`Object has unknown field ${fieldName}`);
      err(obj);
      return false;
    }
    if (!fieldTypeChecker(obj[fieldName])) {
      err(`object failure for ${fieldName}:`);
      err(obj);
      err(
        `Type check result: ${
          fieldTypeChecker(obj[fieldName]) ? 'true' : 'false'
        }`,
      );
      return false;
    }
  }
  return Type.hasStr(obj, 'originalPath');
}

function minMetadataEqual(a: MinimumMetadata, b: MinimumMetadata): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (!Operations.ArraySetEqual(ak, bk)) {
    return false;
  }
  const aa: { [index: string]: undefined | string | number | string[] } = a;
  const bb: { [index: string]: undefined | string | number | string[] } = b;
  for (const k of Object.keys(aa)) {
    if (aa[k] === undefined && bb[k] === undefined) {
      continue;
    }
    if (Type.isString(aa[k]) && Type.isString(bb[k]) && aa[k] === bb[k]) {
      continue;
    }
    if (Type.isArrayOfString(aa[k]) && Type.isArrayOfString(bb[k])) {
      if (Operations.ArraySetEqual(aa[k] as string[], bb[k] as string[])) {
        continue;
      }
    }
    if (Type.isNumber(aa[k]) && Type.isNumber(bb[k]) && aa[k] === bb[k]) {
      continue;
    }
    return false;
  }
  return true;
}

export function isFullMetadata(obj: unknown): obj is FullMetadata {
  if (!isOnlyMetadata(obj)) {
    return false;
  }
  for (const fieldName of mandatoryMetadataKeys) {
    if (!Type.has(obj, fieldName)) {
      return false;
    }
  }
  return true;
}

function MakeMetadataStore(name: string) {
  // The lookup for metadata
  const store = new Map<string, MinimumMetadata>();
  // A flag to keep track of if we've changed anything
  let dirty = false;
  // The set of stuff we've already attempted and failed to get MD for
  const stopTrying = new Set<string>();
  let loaded = false;

  function get(path: string) {
    return store.get(path);
  }
  function set(path: string, md: MinimumMetadata) {
    const curMd = get(path);
    if (curMd && minMetadataEqual(curMd, md)) {
      return;
    }
    dirty = true;
    store.set(path, md);
    stopTrying.delete(path);
  }
  function fail(path: string) {
    if (stopTrying.has(path)) {
      return;
    }
    dirty = true;
    stopTrying.add(path);
  }
  function shouldTry(path: string) {
    return !stopTrying.has(path);
  }
  async function save() {
    if (!dirty) {
      log('Not saving: Store is not dirty');
      return;
    }
    log('Saving store back to disk');
    const valueToSave = {
      store: [...store.values()],
      fails: [...stopTrying],
    };
    dirty = false;
    await Persistence.setItemAsync(name, Pickle(valueToSave));
  }
  async function load() {
    if (loaded) {
      return true;
    }
    const fromFile = await Persistence.getItemAsync(name);
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
      err(`Invalid file format for MDS '${name}'`);
      return false;
    }
    if (
      !Type.has(valuesToRestore, 'store') ||
      !Type.has(valuesToRestore, 'fails')
    ) {
      log('MDS: Format failure');
      return false;
    }
    if (
      !Type.isArray(valuesToRestore.store) ||
      !Type.isArrayOfString(valuesToRestore.fails)
    ) {
      log('MDS: Deep format failure');
      return false;
    }
    store.clear();
    let okay = true;
    valuesToRestore.store.forEach((val: unknown) => {
      if (isOnlyMetadata(val)) {
        store.set(val.originalPath, val);
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
  return { get, set, fail, shouldTry, save, load };
}

const mdcm: Map<string, MetadataStore> = new Map<string, MetadataStore>();

export async function GetMetadataStore(name: string): Promise<MetadataStore> {
  let mdc = mdcm.get(name);
  if (!mdc) {
    mdc = MakeMetadataStore(name);
    mdcm.set(name, mdc);
  }
  if (!(await mdc.load())) log(`Loading Metadata Store "${name}" failed`);
  return mdc;
}

let mdSaveTimer: NodeJS.Timeout | null = null;

/**
 * @function setMediaInfoForSong
 * Responds to a request from the Render process with a flattened set of
 * partial metadata
 * @param  {string} flattenedData? - The (partial) metadata to be used to
 * override file name or internal metadata with
 * @returns Promise
 */
export async function setMediaInfoForSong(
  metadataToUpdate: MinimumMetadata,
): Promise<void> {
  let fullPath: string = metadataToUpdate.originalPath;
  if (fullPath.startsWith('*')) {
    // This means we've got a SongKey instead of a path
    // Get the path from the database
    const db = await getMusicDB();
    if (!db) {
      err('Unable to get the path for a song key for a Metadata update');
      return;
    }
    const sng = db.songs.get(fullPath.substr(1));
    if (!sng) {
      err('Unable to get the song for the song key for a metadata update');
      return;
    }
    fullPath = sng.path;
    metadataToUpdate.originalPath = fullPath;
  }
  const mdStore = await GetMetadataStore('metadataOverride');

  const prevMd = mdStore.get(fullPath);
  mdStore.set(fullPath, { ...prevMd, ...metadataToUpdate });
  // commit the change to the music database
  await UpdateSongMetadata(fullPath, { ...prevMd, ...metadataToUpdate });

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
