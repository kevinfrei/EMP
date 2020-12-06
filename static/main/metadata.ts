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

const log = MakeLogger('metadata', true);
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

export type MetadataCache = {
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

function MakeMetadataCache() {
  // The lookup for metadata
  const cache = new Map<string, Partial<FullMetadata>>();
  // A flag to keep track of if we've changed anything
  let dirty = false;
  // The set of stuff we've already attempted and failed to get MD for
  const stopTrying = new Set<string>();
  let loaded = false;

  function get(path: string) {
    return cache.get(path);
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
    cache.set(path, md);
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
      log('Not saving: Cache is not dirty');
      return;
    }
    log('Saving cache back to disk');
    const valueToSave = {
      cache: [...cache.values()] as FTONData,
      fails: [...stopTrying],
    };
    dirty = false;
    await persist.setItemAsync('metadataCache', FTON.stringify(valueToSave));
  }
  async function load() {
    if (loaded) {
      return true;
    }
    const fromFile = await persist.getItemAsync('metadataCache');
    if (!fromFile) {
      log('MDC File Not Found');
      return false;
    }
    const valuesToRestore = FTON.parse(fromFile);
    if (
      !Type.has(valuesToRestore, 'cache') ||
      !Type.has(valuesToRestore, 'fails')
    ) {
      log('MDC: Format failure');
      return false;
    }
    if (
      !Type.isArray(valuesToRestore.cache) ||
      !Type.isArrayOf(valuesToRestore.fails, Type.isString)
    ) {
      log('MDC: Deep format failure');
      return false;
    }
    cache.clear();
    let okay = true;
    valuesToRestore.cache.forEach((val: unknown) => {
      if (isOnlyMetadata(val)) {
        cache.set(val.originalPath, val);
      } else {
        log(`MDC: failure for ${FTON.stringify(val as FTONData)}`);
        okay = false;
      }
    });
    stopTrying.clear();
    valuesToRestore.fails.forEach((val) => stopTrying.add(val));
    dirty = !okay;
    log(`MDC Load ${okay ? 'Success' : 'Failure'}`);
    loaded = okay;
    return okay;
  }
  return { get, set, fail, shouldTry, save, load };
}

let mdc: MetadataCache | null = null;

export async function GetMetadataCache(): Promise<MetadataCache> {
  mdc = mdc === null ? MakeMetadataCache() : mdc;
  if (!(await mdc.load())) log('Loading Metadata Cache failed');
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
  const mdCache = await GetMetadataCache();
  if (isOnlyMetadata(metadataToUpdate)) {
    const prevMd = mdCache.get(fullPath);
    mdCache.set(fullPath, { ...prevMd, ...metadataToUpdate });
  }
  // For now, Update the database
  // TODO: Make this faster. A full rescan seems awfully wasteful.
  UpdateDB();
}
