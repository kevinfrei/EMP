import {
  Attributes,
  FTON,
  FTONData,
  FullMetadata,
  MakeError,
  MakeLogger,
  ObjUtil,
  Type,
} from '@freik/core-utils';
import { MD } from '@freik/media-utils';
import { UpdateDB } from './musicDB';
import * as persist from './persist';

const log = MakeLogger('metadata');
const err = MakeError('metadata-err');

declare type NestedValue =
  | NestedObject
  | NestedValue[]
  | number
  | string
  | boolean;
declare type NestedObject = { [key: string]: NestedValue };

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
  const maybeSimple = await MD.fromFileAsync(mediaPath);
  const simple: NestedObject = ((maybeSimple as any) as NestedObject) || {};
  const maybeFull = maybeSimple
    ? MD.FullFromObj(mediaPath, (maybeSimple as any) as Attributes)
    : null;
  const full: NestedObject = ((maybeFull as any) as NestedObject) || {};
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
  get: (path: string) => Partial<FullMetadata> | void;
  set: (path: string, md: Partial<FullMetadata>) => void;
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
]);

const mandatoryMetadataKeys: string[] = [
  'originalPath',
  'artist',
  'album',
  'track',
  'title',
];

// Checks to make sure obj is a Partial<FullMetadata>
export function isOnlyMetadata(
  obj: unknown,
): obj is Partial<FullMetadata> & { originalPath: string } {
  if (!Type.isObjectNonNull(obj)) {
    err("object isn't non-null");
    err(obj);
    return false;
  }
  for (const fieldName in obj) {
    if (obj.hasOwnProperty(fieldName)) {
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
  }
  return Type.hasStr(obj, 'originalPath');
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
  const store = new Map<string, Partial<FullMetadata>>();
  // A flag to keep track of if we've changed anything
  let dirty = false;
  // The set of stuff we've already attempted and failed to get MD for
  const stopTrying = new Set<string>();
  let loaded = false;

  function get(path: string) {
    return store.get(path);
  }
  function set(path: string, md: Partial<FullMetadata>) {
    const curMd = get(path);
    if (
      curMd &&
      FTON.stringify(curMd as FTONData) === FTON.stringify(md as FTONData)
    ) {
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
      store: [...store.values()] as FTONData,
      fails: [...stopTrying],
    };
    dirty = false;
    await persist.setItemAsync(name, FTON.stringify(valueToSave));
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
    const valuesToRestore = FTON.parse(fromFile);
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
        log(`MDS: failure for ${FTON.stringify(val as FTONData)}`);
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

export async function setMediaInfoForSong(
  flattenedData?: string,
): Promise<void> {
  if (!flattenedData) {
    return;
  }
  const metadataToUpdate = FTON.parse(flattenedData);
  if (!Type.isObjectNonNull(metadataToUpdate)) {
    err('Invalid data to setMediaInfoForSong');
    return;
  }
  if (!Type.hasStr(metadataToUpdate, 'originalPath')) {
    err('Missing "originalPath" attribute');
    err(metadataToUpdate);
    return;
  }
  const fullPath: string = metadataToUpdate.originalPath;
  const mdStore = await GetMetadataStore('metadataOverride');
  if (isOnlyMetadata(metadataToUpdate)) {
    const prevMd = mdStore.get(fullPath);
    mdStore.set(fullPath, { ...prevMd, ...metadataToUpdate });
  }
  await mdStore.save();
  // For now, Update the database
  // TODO: Make this faster. A full rescan seems awfully wasteful.
  // First TODO is to debounce it every 10 seconds or so, probably
  UpdateDB();
}
